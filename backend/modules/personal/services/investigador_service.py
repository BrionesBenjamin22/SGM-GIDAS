from datetime import date

from sqlalchemy.exc import IntegrityError

from extension import db
from modules.personal.models.personal import Investigador, TipoDedicacion, InvestigadorHorasHistorial, InvestigadorMemoriaVersion
from modules.catalogos.models.categoria_utn import CategoriaUtn
from modules.grupo.models.programa_incentivos import ProgramaIncentivos
from modules.grupo.models.grupo import GrupoInvestigacionUtn
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


def _obtener_historiales_activos(investigador):
    return [h for h in investigador.historial_horas if h.fecha_fin is None]


def _obtener_historial_activo_unico(investigador):
    historiales_activos = _obtener_historiales_activos(investigador)

    if len(historiales_activos) > 1:
        raise ValueError("El investigador tiene mas de un historial de horas activo.")

    return historiales_activos[0] if historiales_activos else None


def _resolver_horas_activas(investigador):
    historial_activo = _obtener_historial_activo_unico(investigador)
    return (
        historial_activo.horas_semanales
        if historial_activo else investigador.horas_semanales
    )


def _cerrar_historial(historial_activo):
    if historial_activo.fecha_inicio > date.today():
        raise ValueError("El historial activo tiene una fecha de inicio invalida.")

    historial_activo.fecha_fin = date.today()


def _obtener_investigador_activo(id: int):
    _validar_id_positivo(id, "id")

    investigador = Investigador.query.filter(
        Investigador.deleted_at.is_(None),
        Investigador.id == id
    ).first()

    if not investigador:
        raise ValueError("Investigador no encontrado.")

    return investigador


def _validar_tipo_dedicacion(tipo_dedicacion_id):
    tipo_dedicacion_id = _validar_id_positivo(tipo_dedicacion_id, "tipo_dedicacion_id")

    if not TipoDedicacion.query.get(tipo_dedicacion_id):
        raise ValueError("Tipo de dedicacion invalido.")

    return tipo_dedicacion_id


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


def _validar_grupo_utn(grupo_utn_id):
    grupo_utn_id = _validar_id_positivo(
        grupo_utn_id, "grupo_utn_id", permitir_none=True
    )

    if grupo_utn_id and not GrupoInvestigacionUtn.query.get(grupo_utn_id):
        raise ValueError("Grupo UTN invalido.")

    return grupo_utn_id


# =====================================================
# CREATE
# =====================================================

def crear_investigador(data, user_id):
    _validar_payload(data)
    _validar_user_id(user_id)

    nombre = _validar_nombre(data.get("nombre_apellido"))
    horas = _validar_horas(data.get("horas_semanales"))
    tipo_dedicacion_id = _validar_tipo_dedicacion(data.get("tipo_dedicacion_id"))

    investigador = Investigador(
        nombre_apellido=nombre,
        horas_semanales=horas,
        fecha_alta_grupo=validar_fecha_alta_grupo(
            data.get("fecha_alta_grupo")
        ),
        tipo_dedicacion_id=tipo_dedicacion_id,
        categoria_utn_id=_validar_categoria_utn(data.get("categoria_utn_id")),
        programa_incentivos_id=_validar_programa_incentivos(data.get("programa_incentivos_id")),
        grupo_utn_id=_validar_grupo_utn(data.get("grupo_utn_id")),
        activo=True,
        created_by=user_id
    )

    db.session.add(investigador)
    db.session.flush()

    historial = InvestigadorHorasHistorial(
        investigador_id=investigador.id,
        horas_semanales=horas,
        fecha_inicio=date.today(),
        fecha_fin=None,
        created_by=user_id
    )

    db.session.add(historial)

    try:
        db.session.commit()
        return investigador
    except IntegrityError:
        db.session.rollback()
        raise ValueError("Error de integridad al crear el investigador.")


# =====================================================
# UPDATE
# =====================================================

def actualizar_investigador(id, data, user_id):
    _validar_payload(data)
    _validar_user_id(user_id)

    investigador = _obtener_investigador_activo(id)
    cambios = {}

    if "nombre_apellido" in data:
        nuevo_valor = _validar_nombre(data["nombre_apellido"])
        cambio = AuditoriaService.construir_cambio(
            investigador.nombre_apellido,
            nuevo_valor
        )
        if cambio:
            cambios["nombre_apellido"] = cambio
            investigador.nombre_apellido = nuevo_valor

    if "horas_semanales" in data:
        horas = _validar_horas(data["horas_semanales"])
        historial_activo = _obtener_historial_activo_unico(investigador)
        cambio = AuditoriaService.construir_cambio(
            investigador.horas_semanales,
            horas
        )

        if not historial_activo:
            nuevo = InvestigadorHorasHistorial(
                investigador_id=investigador.id,
                horas_semanales=horas,
                fecha_inicio=date.today(),
                fecha_fin=None,
                created_by=user_id
            )
            db.session.add(nuevo)
        elif historial_activo.horas_semanales != horas:
            _cerrar_historial(historial_activo)

            nuevo = InvestigadorHorasHistorial(
                investigador_id=investigador.id,
                horas_semanales=horas,
                fecha_inicio=date.today(),
                fecha_fin=None,
                created_by=user_id
            )

            db.session.add(nuevo)

        if cambio:
            cambios["horas_semanales"] = cambio
            investigador.horas_semanales = horas

    if "tipo_dedicacion_id" in data:
        nuevo_valor = _validar_tipo_dedicacion(
            data["tipo_dedicacion_id"]
        )
        cambio = AuditoriaService.construir_cambio(
            investigador.tipo_dedicacion_id,
            nuevo_valor
        )
        if cambio:
            cambios["tipo_dedicacion_id"] = cambio
            investigador.tipo_dedicacion_id = nuevo_valor

    if "categoria_utn_id" in data:
        nuevo_valor = _validar_categoria_utn(
            data["categoria_utn_id"]
        )
        cambio = AuditoriaService.construir_cambio(
            investigador.categoria_utn_id,
            nuevo_valor
        )
        if cambio:
            cambios["categoria_utn_id"] = cambio
            investigador.categoria_utn_id = nuevo_valor

    if "programa_incentivos_id" in data:
        nuevo_valor = _validar_programa_incentivos(
            data["programa_incentivos_id"]
        )
        cambio = AuditoriaService.construir_cambio(
            investigador.programa_incentivos_id,
            nuevo_valor
        )
        if cambio:
            cambios["programa_incentivos_id"] = cambio
            investigador.programa_incentivos_id = nuevo_valor

    if "grupo_utn_id" in data:
        nuevo_valor = _validar_grupo_utn(data["grupo_utn_id"])
        cambio = AuditoriaService.construir_cambio(
            investigador.grupo_utn_id,
            nuevo_valor
        )
        if cambio:
            cambios["grupo_utn_id"] = cambio
            investigador.grupo_utn_id = nuevo_valor

    if "fecha_alta_grupo" in data:
        nuevo_valor = validar_fecha_alta_grupo(data["fecha_alta_grupo"])
        cambio = AuditoriaService.construir_cambio(
            investigador.fecha_alta_grupo,
            nuevo_valor
        )
        if cambio:
            cambios["fecha_alta_grupo"] = cambio
            investigador.fecha_alta_grupo = nuevo_valor

    if cambios:
        investigador.mark_updated(user_id)
        AuditoriaService.registrar_cambios(
            entidad="investigador",
            registro_id=investigador.id,
            cambios=cambios,
            user_id=user_id
        )

    try:
        db.session.commit()
        return investigador
    except Exception:
        db.session.rollback()
        raise


# =====================================================
# DELETE (Soft Delete + cerrar historial)
# =====================================================

def eliminar_investigador(id, user_id):
    _validar_user_id(user_id)

    investigador = _obtener_investigador_activo(id)
    historial_activo = _obtener_historial_activo_unico(investigador)

    if historial_activo:
        _cerrar_historial(historial_activo)

    investigador.activo = False
    investigador.soft_delete(user_id)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return {
        "message": "Investigador eliminado correctamente.",
        "id": investigador.id
    }


# =====================================================
# RESTAURAR
# =====================================================

def restaurar_investigador(id):
    _validar_id_positivo(id, "id")

    investigador = db.session.query(Investigador).filter(
        Investigador.deleted_at.isnot(None),
        Investigador.id == id
    ).first()

    if not investigador:
        raise ValueError("No existe investigador eliminado para restaurar.")

    investigador.restore()
    investigador.activo = True

    db.session.commit()

    return investigador


# =====================================================
# LISTAR
# =====================================================

def listar_investigadores(activos=None):
    query = Investigador.query

    if activos is None:
        activos = "true"

    activos = str(activos).strip().lower()

    if activos == "true":
        query = query.filter(Investigador.deleted_at.is_(None))
    elif activos == "false":
        query = query.filter(Investigador.deleted_at.isnot(None))
    elif activos == "all":
        pass
    else:
        query = query.filter(Investigador.deleted_at.is_(None))

    return query.all()


# =====================================================
# OBTENER POR ID
# =====================================================

def obtener_investigador_por_id(id):
    _validar_id_positivo(id, "id")

    investigador = Investigador.query.get(id)

    if not investigador:
        raise ValueError("Investigador no encontrado.")

    return investigador


def obtener_historial_investigador(id):
    investigador = obtener_investigador_por_id(id)
    return AuditoriaService.obtener_historial_entidad(
        entidad="investigador",
        registro_id=investigador.id
    )


def snapshot_investigadores_para_memoria_version(memoria_version, user_id):
    investigadores = Investigador.query.filter().all()

    snapshots = []
    for investigador in investigadores:
        if not estuvo_activo_en_periodo_memoria(
            memoria_version,
            investigador.fecha_alta_grupo,
            getattr(investigador, "deleted_at", None)
        ):
            continue
        snapshot = InvestigadorMemoriaVersion(
            memoria_version_id=memoria_version.id,
            investigador_id=investigador.id,
            nombre_apellido=investigador.nombre_apellido,
            horas_semanales=_resolver_horas_activas(investigador),
            tipo_dedicacion_id=investigador.tipo_dedicacion_id,
            tipo_dedicacion_nombre=(
                investigador.tipo_dedicacion.nombre
                if investigador.tipo_dedicacion else None
            ),
            categoria_utn_id=investigador.categoria_utn_id,
            categoria_utn_nombre=(
                investigador.categoria_utn.nombre
                if investigador.categoria_utn else None
            ),
            programa_incentivos_id=investigador.programa_incentivos_id,
            programa_incentivos_nombre=(
                investigador.programa_incentivos.nombre
                if investigador.programa_incentivos else None
            ),
            grupo_utn_id=investigador.grupo_utn_id,
            grupo_utn_nombre=(
                investigador.grupo_utn.nombre_sigla_grupo
                if investigador.grupo_utn else None
            ),
            created_by=user_id
        )
        db.session.add(snapshot)
        snapshots.append(snapshot)

    return snapshots


def obtener_snapshots_investigadores_por_memoria_version(memoria_version_id):
    snapshots = (
        InvestigadorMemoriaVersion.query
        .filter(
            InvestigadorMemoriaVersion.memoria_version_id == memoria_version_id,
            InvestigadorMemoriaVersion.deleted_at.is_(None)
        )
        .order_by(InvestigadorMemoriaVersion.nombre_apellido.asc())
        .all()
    )

    return [snapshot.serialize() for snapshot in snapshots]
