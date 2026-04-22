from datetime import date

from extension import db
from core.models.personal import Becario, TipoFormacion, BecarioHorasHistorial
from core.models.grupo import GrupoInvestigacionUtn
from core.models.proyecto_investigacion import ProyectoInvestigacion


# =====================================================
# HELPERS
# =====================================================

def _validar_payload(data: dict):
    if not isinstance(data, dict) or not data:
        raise ValueError("Los datos no pueden estar vacios.")


def _validar_id_positivo(valor, campo: str, permitir_none: bool = False):
    if valor is None and permitir_none:
        return valor

    if not isinstance(valor, int) or valor <= 0:
        raise ValueError(f"El campo '{campo}' debe ser un entero positivo.")

    return valor


def _validar_user_id(user_id: int):
    if not isinstance(user_id, int) or user_id <= 0:
        raise ValueError("El user_id es invalido.")


def _validar_nombre(nombre: str):
    if not isinstance(nombre, str):
        raise ValueError("El nombre y apellido es obligatorio.")

    nombre = nombre.strip()

    if not nombre:
        raise ValueError("El nombre y apellido es obligatorio.")

    if len(nombre) > 120:
        raise ValueError("El nombre y apellido no puede superar los 120 caracteres.")

    return nombre


def _validar_horas(horas):
    if not isinstance(horas, int) or horas <= 0:
        raise ValueError("Las horas semanales deben ser un numero positivo.")

    return horas


def _validar_proyectos_ids(proyectos_ids):
    if not isinstance(proyectos_ids, list):
        raise ValueError("El campo 'proyectos' debe ser una lista.")

    ids_normalizados = []
    ids_vistos = set()

    for proyecto_id in proyectos_ids:
        proyecto_id = _validar_id_positivo(proyecto_id, "proyectos")

        if proyecto_id in ids_vistos:
            raise ValueError("El campo 'proyectos' no puede contener IDs repetidos.")

        ids_vistos.add(proyecto_id)
        ids_normalizados.append(proyecto_id)

    return ids_normalizados


def _obtener_proyectos_validos(proyectos_ids):
    if not proyectos_ids:
        return []

    proyectos = ProyectoInvestigacion.query.filter(
        ProyectoInvestigacion.id.in_(proyectos_ids)
    ).all()

    proyectos_activos = [
        proyecto
        for proyecto in proyectos
        if getattr(proyecto, "deleted_at", None) is None
    ]

    if len(proyectos_activos) != len(proyectos_ids):
        raise ValueError("Uno o mas proyectos son invalidos.")

    return proyectos_activos


def _obtener_historiales_activos(becario):
    return [h for h in becario.historial_horas if h.fecha_fin is None]


def _obtener_historial_activo_unico(becario):
    historiales_activos = _obtener_historiales_activos(becario)

    if len(historiales_activos) > 1:
        raise ValueError("El becario tiene mas de un historial de horas activo.")

    return historiales_activos[0] if historiales_activos else None


def _cerrar_historial(historial_activo):
    if historial_activo.fecha_inicio > date.today():
        raise ValueError("El historial activo tiene una fecha de inicio invalida.")

    historial_activo.fecha_fin = date.today()


def _get_activo_or_404(id: int):
    _validar_id_positivo(id, "id")

    becario = db.session.get(Becario, id)

    if not becario or becario.deleted_at is not None:
        raise ValueError("Becario no encontrado.")

    return becario


# =====================================================
# CREATE
# =====================================================
def crear_becario(data: dict, user_id: int):
    _validar_payload(data)
    _validar_user_id(user_id)

    nombre = _validar_nombre(data.get("nombre_apellido"))
    horas = _validar_horas(data.get("horas_semanales"))
    tipo_formacion_id = _validar_id_positivo(
        data.get("tipo_formacion_id"), "tipo_formacion_id"
    )
    grupo_utn_id = _validar_id_positivo(
        data.get("grupo_utn_id"), "grupo_utn_id", permitir_none=True
    )
    proyectos_ids = _validar_proyectos_ids(data.get("proyectos", []))

    if not TipoFormacion.query.get(tipo_formacion_id):
        raise ValueError("Tipo de formacion invalido.")

    if grupo_utn_id and not GrupoInvestigacionUtn.query.get(grupo_utn_id):
        raise ValueError("Grupo UTN invalido.")

    becario = Becario(
        nombre_apellido=nombre,
        horas_semanales=horas,
        tipo_formacion_id=tipo_formacion_id,
        grupo_utn_id=grupo_utn_id,
        activo=True,
        created_by=user_id
    )

    db.session.add(becario)
    db.session.flush()

    historial = BecarioHorasHistorial(
        becario_id=becario.id,
        horas_semanales=horas,
        fecha_inicio=date.today(),
        fecha_fin=None,
        created_by=user_id
    )

    db.session.add(historial)

    if proyectos_ids:
        proyectos = _obtener_proyectos_validos(proyectos_ids)
        becario.participaciones_proyecto = proyectos

    try:
        db.session.commit()
        return becario
    except Exception:
        db.session.rollback()
        raise


# =====================================================
# UPDATE
# =====================================================

def actualizar_becario(id: int, data: dict, user_id: int):
    _validar_payload(data)
    _validar_user_id(user_id)

    becario = _get_activo_or_404(id)

    if "activo" in data:
        if not isinstance(data["activo"], bool):
            raise ValueError("El campo 'activo' debe ser booleano.")

        if data["activo"] is False:
            raise ValueError("Para dar de baja un becario debe utilizarse el metodo eliminar.")

        becario.activo = data["activo"]

    if "nombre_apellido" in data:
        becario.nombre_apellido = _validar_nombre(data["nombre_apellido"])

    if "horas_semanales" in data:
        horas = _validar_horas(data["horas_semanales"])
        historial_activo = _obtener_historial_activo_unico(becario)

        if not historial_activo:
            nuevo_historial = BecarioHorasHistorial(
                becario_id=becario.id,
                horas_semanales=horas,
                fecha_inicio=date.today(),
                fecha_fin=None,
                created_by=user_id
            )
            db.session.add(nuevo_historial)
        elif historial_activo.horas_semanales != horas:
            _cerrar_historial(historial_activo)

            nuevo_historial = BecarioHorasHistorial(
                becario_id=becario.id,
                horas_semanales=horas,
                fecha_inicio=date.today(),
                fecha_fin=None,
                created_by=user_id
            )

            db.session.add(nuevo_historial)

        becario.horas_semanales = horas

    if "tipo_formacion_id" in data:
        tipo_formacion_id = _validar_id_positivo(
            data["tipo_formacion_id"], "tipo_formacion_id"
        )
        if not TipoFormacion.query.get(tipo_formacion_id):
            raise ValueError("Tipo de formacion invalido.")
        becario.tipo_formacion_id = tipo_formacion_id

    if "grupo_utn_id" in data:
        grupo_utn_id = _validar_id_positivo(
            data["grupo_utn_id"], "grupo_utn_id", permitir_none=True
        )
        if grupo_utn_id and not GrupoInvestigacionUtn.query.get(grupo_utn_id):
            raise ValueError("Grupo UTN invalido.")
        becario.grupo_utn_id = grupo_utn_id

    if "proyectos" in data:
        proyectos_ids = _validar_proyectos_ids(data["proyectos"])
        proyectos = _obtener_proyectos_validos(proyectos_ids)
        becario.participaciones_proyecto = proyectos

    try:
        db.session.commit()
        return becario
    except Exception:
        db.session.rollback()
        raise


# =====================================================
# SOFT DELETE
# =====================================================

def eliminar_becario(id: int, user_id: int):
    _validar_user_id(user_id)

    becario = _get_activo_or_404(id)

    if not becario.activo:
        raise ValueError("El becario ya se encuentra dado de baja.")

    historial_activo = _obtener_historial_activo_unico(becario)

    if historial_activo:
        _cerrar_historial(historial_activo)

    becario.activo = False
    becario.soft_delete(user_id)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return {
        "message": "Becario eliminado correctamente.",
        "id": becario.id
    }


# =====================================================
# LISTAR
# =====================================================

def listar_becarios(activos=None):
    query = Becario.query

    if activos is None:
        activos = "true"

    activos = str(activos).strip().lower()

    if activos == "true":
        query = query.filter(Becario.deleted_at.is_(None))
    elif activos == "false":
        query = query.filter(Becario.deleted_at.isnot(None))
    elif activos == "all":
        pass
    else:
        query = query.filter(Becario.deleted_at.is_(None))

    return query.all()


# =====================================================
# OBTENER POR ID
# =====================================================

def obtener_becario_por_id(id: int):
    _validar_id_positivo(id, "id")

    becario = db.session.get(Becario, id)
    if not becario:
        raise ValueError("Becario no encontrado.")

    return becario
