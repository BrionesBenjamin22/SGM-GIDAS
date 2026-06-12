from datetime import date

from extension import db
from modules.personal.models.personal import (
    Personal,
    Becario,
    Investigador,
    PersonalMemoriaVersion,
    PersonalHorasHistorial,
    BecarioHorasHistorial,
    InvestigadorHorasHistorial,
)
from modules.personal.models.tipo_personal import TipoPersonal
from modules.grupo.models.grupo import GrupoInvestigacionUtn
from modules.personal.models.personal import TipoFormacion, TipoDedicacion
from modules.catalogos.models.categoria_utn import CategoriaUtn
from modules.grupo.models.programa_incentivos import ProgramaIncentivos
from modules.shared.services.auditoria_service import AuditoriaService
from modules.memorias.services.memoria_periodo_service import (
    validar_fecha_alta_grupo,
    estuvo_activo_en_periodo_memoria,
)


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


def _obtener_historiales_activos(entidad):
    return [h for h in entidad.historial_horas if h.fecha_fin is None]


def _obtener_historial_activo_unico(entidad):
    historiales_activos = _obtener_historiales_activos(entidad)

    if len(historiales_activos) > 1:
        raise ValueError("La entidad tiene mas de un historial de horas activo.")

    return historiales_activos[0] if historiales_activos else None


def _cerrar_historial(historial_activo):
    if historial_activo.fecha_inicio > date.today():
        raise ValueError("El historial activo tiene una fecha de inicio invalida.")

    historial_activo.fecha_fin = date.today()


def _resolver_horas_activas(entidad):
    historial_activo = _obtener_historial_activo_unico(entidad)
    return (
        historial_activo.horas_semanales
        if historial_activo else entidad.horas_semanales
    )


def _resolver_entidad_por_rol(id, rol):
    _validar_id_positivo(id, "id")

    if rol == "personal":
        entidad = Personal.query.get(id)
        historial_model = PersonalHorasHistorial
        fk_field = "personal_id"
    elif rol == "becario":
        entidad = Becario.query.get(id)
        historial_model = BecarioHorasHistorial
        fk_field = "becario_id"
    elif rol == "investigador":
        entidad = Investigador.query.get(id)
        historial_model = InvestigadorHorasHistorial
        fk_field = "investigador_id"
    else:
        raise ValueError("Rol invalido.")

    return entidad, historial_model, fk_field


def _validar_tipo_personal(tipo_personal_id):
    tipo_personal_id = _validar_id_positivo(tipo_personal_id, "tipo_personal_id")

    if not TipoPersonal.query.get(tipo_personal_id):
        raise ValueError("Tipo de personal invalido.")

    return tipo_personal_id


def _validar_tipo_formacion(tipo_formacion_id):
    tipo_formacion_id = _validar_id_positivo(tipo_formacion_id, "tipo_formacion_id")

    if not TipoFormacion.query.get(tipo_formacion_id):
        raise ValueError("Tipo de formacion invalido.")

    return tipo_formacion_id


def _validar_tipo_dedicacion(tipo_dedicacion_id):
    tipo_dedicacion_id = _validar_id_positivo(tipo_dedicacion_id, "tipo_dedicacion_id")

    if not TipoDedicacion.query.get(tipo_dedicacion_id):
        raise ValueError("Tipo de dedicacion invalido.")

    return tipo_dedicacion_id


def _validar_grupo_utn(grupo_utn_id, obligatorio=False):
    grupo_utn_id = _validar_id_positivo(
        grupo_utn_id,
        "grupo_utn_id",
        permitir_none=not obligatorio,
    )

    if grupo_utn_id is None:
        return None

    if not GrupoInvestigacionUtn.query.get(grupo_utn_id):
        raise ValueError("Grupo UTN invalido.")

    return grupo_utn_id


def _validar_categoria_utn(categoria_utn_id):
    categoria_utn_id = _validar_id_positivo(
        categoria_utn_id, "categoria_utn_id", permitir_none=True
    )

    if categoria_utn_id and not CategoriaUtn.query.get(categoria_utn_id):
        raise ValueError("Categoria UTN invalida.")

    return categoria_utn_id


def _validar_programa_incentivos(programa_incentivos_id):
    programa_incentivos_id = _validar_id_positivo(
        programa_incentivos_id, "programa_incentivos_id", permitir_none=True
    )

    if programa_incentivos_id and not ProgramaIncentivos.query.get(programa_incentivos_id):
        raise ValueError("Programa de incentivos invalido.")

    return programa_incentivos_id


# =====================================================
# CREAR PERSONAL
# =====================================================

def crear_personal(data, user_id):
    _validar_payload(data)
    _validar_user_id(user_id)

    nombre = _validar_nombre(data.get("nombre_apellido"))
    horas = _validar_horas(data.get("horas_semanales"))
    tipo_personal_id = _validar_tipo_personal(data.get("tipo_personal_id"))
    grupo_utn_id = _validar_grupo_utn(data.get("grupo_utn_id"), obligatorio=True)

    nuevo = Personal(
        nombre_apellido=nombre,
        horas_semanales=horas,
        fecha_alta_grupo=validar_fecha_alta_grupo(
            data.get("fecha_alta_grupo")
        ),
        tipo_personal_id=tipo_personal_id,
        grupo_utn_id=grupo_utn_id,
        activo=True,
        created_by=user_id
    )

    db.session.add(nuevo)
    db.session.flush()

    historial = PersonalHorasHistorial(
        personal_id=nuevo.id,
        horas_semanales=horas,
        fecha_inicio=date.today(),
        fecha_fin=None,
        created_by=user_id
    )

    db.session.add(historial)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return nuevo


# =====================================================
# ACTUALIZAR PERSONAL
# =====================================================

def actualizar_personal(id, data, rol, user_id: int):
    _validar_payload(data)
    _validar_user_id(user_id)

    entidad, historial_model, fk_field = _resolver_entidad_por_rol(id, rol)
    cambios = {}

    if not entidad:
        raise ValueError("Registro no encontrado.")

    if entidad.deleted_at is not None:
        raise ValueError("No se puede modificar un registro eliminado.")

    if "nombre_apellido" in data:
        nuevo_valor = _validar_nombre(data["nombre_apellido"])
        cambio = AuditoriaService.construir_cambio(
            entidad.nombre_apellido,
            nuevo_valor
        )
        if cambio:
            cambios["nombre_apellido"] = cambio
            entidad.nombre_apellido = nuevo_valor

    if "horas_semanales" in data:
        horas = _validar_horas(data["horas_semanales"])
        historial_activo = _obtener_historial_activo_unico(entidad)
        cambio = AuditoriaService.construir_cambio(
            entidad.horas_semanales,
            horas
        )

        if not historial_activo:
            nuevo = historial_model(
                **{fk_field: entidad.id},
                horas_semanales=horas,
                fecha_inicio=date.today(),
                fecha_fin=None,
                created_by=user_id
            )
            db.session.add(nuevo)
        elif historial_activo.horas_semanales != horas:
            _cerrar_historial(historial_activo)

            nuevo = historial_model(
                **{fk_field: entidad.id},
                horas_semanales=horas,
                fecha_inicio=date.today(),
                fecha_fin=None,
                created_by=user_id
            )
            db.session.add(nuevo)

        if cambio:
            cambios["horas_semanales"] = cambio
            entidad.horas_semanales = horas

    if "activo" in data:
        if not isinstance(data["activo"], bool):
            raise ValueError("El campo 'activo' debe ser booleano.")

        if data["activo"] is False:
            raise ValueError("Para dar de baja un registro debe utilizarse el metodo eliminar.")

        entidad.activo = data["activo"]

    if "fecha_alta_grupo" in data:
        nuevo_valor = validar_fecha_alta_grupo(data["fecha_alta_grupo"])
        cambio = AuditoriaService.construir_cambio(
            entidad.fecha_alta_grupo,
            nuevo_valor
        )
        if cambio:
            cambios["fecha_alta_grupo"] = cambio
            entidad.fecha_alta_grupo = nuevo_valor

    if rol == "investigador":
        if "tipo_dedicacion_id" in data:
            nuevo_valor = _validar_tipo_dedicacion(
                data["tipo_dedicacion_id"]
            )
            cambio = AuditoriaService.construir_cambio(
                entidad.tipo_dedicacion_id,
                nuevo_valor
            )
            if cambio:
                cambios["tipo_dedicacion_id"] = cambio
                entidad.tipo_dedicacion_id = nuevo_valor

        if "categoria_utn_id" in data:
            nuevo_valor = _validar_categoria_utn(data["categoria_utn_id"])
            cambio = AuditoriaService.construir_cambio(
                entidad.categoria_utn_id,
                nuevo_valor
            )
            if cambio:
                cambios["categoria_utn_id"] = cambio
                entidad.categoria_utn_id = nuevo_valor

        if "programa_incentivos_id" in data:
            nuevo_valor = _validar_programa_incentivos(
                data["programa_incentivos_id"]
            )
            cambio = AuditoriaService.construir_cambio(
                entidad.programa_incentivos_id,
                nuevo_valor
            )
            if cambio:
                cambios["programa_incentivos_id"] = cambio
                entidad.programa_incentivos_id = nuevo_valor

        if "grupo_utn_id" in data:
            nuevo_valor = _validar_grupo_utn(data["grupo_utn_id"])
            cambio = AuditoriaService.construir_cambio(
                entidad.grupo_utn_id,
                nuevo_valor
            )
            if cambio:
                cambios["grupo_utn_id"] = cambio
                entidad.grupo_utn_id = nuevo_valor

    if rol == "becario":
        if "tipo_formacion_id" in data:
            nuevo_valor = _validar_tipo_formacion(data["tipo_formacion_id"])
            cambio = AuditoriaService.construir_cambio(
                entidad.tipo_formacion_id,
                nuevo_valor
            )
            if cambio:
                cambios["tipo_formacion_id"] = cambio
                entidad.tipo_formacion_id = nuevo_valor

        if "grupo_utn_id" in data:
            nuevo_valor = _validar_grupo_utn(data["grupo_utn_id"])
            cambio = AuditoriaService.construir_cambio(
                entidad.grupo_utn_id,
                nuevo_valor
            )
            if cambio:
                cambios["grupo_utn_id"] = cambio
                entidad.grupo_utn_id = nuevo_valor

    if rol == "personal":
        if "tipo_personal_id" in data:
            nuevo_valor = _validar_tipo_personal(data["tipo_personal_id"])
            cambio = AuditoriaService.construir_cambio(
                entidad.tipo_personal_id,
                nuevo_valor
            )
            if cambio:
                cambios["tipo_personal_id"] = cambio
                entidad.tipo_personal_id = nuevo_valor

        if "grupo_utn_id" in data:
            nuevo_valor = _validar_grupo_utn(
                data["grupo_utn_id"],
                obligatorio=True
            )
            cambio = AuditoriaService.construir_cambio(
                entidad.grupo_utn_id,
                nuevo_valor
            )
            if cambio:
                cambios["grupo_utn_id"] = cambio
                entidad.grupo_utn_id = nuevo_valor

    if cambios:
        entidad.mark_updated(user_id)
        AuditoriaService.registrar_cambios(
            entidad=rol,
            registro_id=entidad.id,
            cambios=cambios,
            user_id=user_id
        )

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return entidad


# =====================================================
# SOFT DELETE
# =====================================================

def eliminar_personal_por_rol(id, rol, user_id):
    _validar_user_id(user_id)

    entidad, _, _ = _resolver_entidad_por_rol(id, rol)

    if not entidad:
        raise ValueError("Registro no encontrado.")

    if entidad.deleted_at is not None:
        raise ValueError("El registro ya se encuentra eliminado.")

    historial_activo = _obtener_historial_activo_unico(entidad)

    if historial_activo:
        _cerrar_historial(historial_activo)

    entidad.activo = False
    entidad.soft_delete(user_id)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return {
        "message": "Personal eliminado correctamente (soft delete).",
        "id": entidad.id
    }


# =====================================================
# RESTORE
# =====================================================

def restaurar_personal(id, rol):
    entidad, _, _ = _resolver_entidad_por_rol(id, rol)

    if not entidad:
        raise ValueError("Personal no encontrado.")

    entidad.restore()

    db.session.commit()

    return entidad


# =====================================================
# LISTAR
# =====================================================

def listar_personal(activos="true"):
    query = Personal.query

    if activos is None:
        activos = "true"

    activos = str(activos).strip().lower()

    if activos == "true":
        query = query.filter(Personal.deleted_at.is_(None))
    elif activos == "false":
        query = query.filter(Personal.deleted_at.isnot(None))
    elif activos == "all":
        pass
    else:
        query = query.filter(Personal.deleted_at.is_(None))

    return query.all()


# =====================================================
# OBTENER POR ID
# =====================================================

def obtener_personal_por_id(id):
    _validar_id_positivo(id, "id")

    personal = Personal.query.get(id)

    if not personal:
        raise ValueError("Personal no encontrado.")

    return personal


def obtener_historial_personal_por_rol(id, rol):
    entidad, _, _ = _resolver_entidad_por_rol(id, rol)

    if not entidad:
        raise ValueError("Registro no encontrado.")

    return AuditoriaService.obtener_historial_entidad(
        entidad=rol,
        registro_id=entidad.id
    )


def snapshot_personal_para_memoria_version(memoria_version, user_id):
    personales = Personal.query.filter().all()

    snapshots = []
    for personal in personales:
        if not estuvo_activo_en_periodo_memoria(
            memoria_version,
            personal.fecha_alta_grupo,
            getattr(personal, "deleted_at", None)
        ):
            continue
        snapshot = PersonalMemoriaVersion(
            memoria_version_id=memoria_version.id,
            personal_id=personal.id,
            nombre_apellido=personal.nombre_apellido,
            horas_semanales=_resolver_horas_activas(personal),
            tipo_personal_id=personal.tipo_personal_id,
            tipo_personal_nombre=(
                personal.tipo_personal.nombre
                if personal.tipo_personal else None
            ),
            grupo_utn_id=personal.grupo_utn_id,
            grupo_utn_nombre=(
                personal.grupo_utn.nombre_sigla_grupo
                if personal.grupo_utn else None
            ),
            created_by=user_id
        )
        db.session.add(snapshot)
        snapshots.append(snapshot)

    return snapshots


def obtener_snapshots_personal_por_memoria_version(memoria_version_id):
    snapshots = (
        PersonalMemoriaVersion.query
        .filter(
            PersonalMemoriaVersion.memoria_version_id == memoria_version_id,
            PersonalMemoriaVersion.deleted_at.is_(None)
        )
        .order_by(PersonalMemoriaVersion.nombre_apellido.asc())
        .all()
    )

    return [snapshot.serialize() for snapshot in snapshots]
