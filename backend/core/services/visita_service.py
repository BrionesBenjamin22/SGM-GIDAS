from datetime import datetime, date

from extension import db
from core.models.visita_grupo import (
    VisitaAcademica,
    VisitaAcademicaMemoriaVersion,
)
from core.models.grupo import GrupoInvestigacionUtn
from core.models.trabajo_reunion import TipoReunion
from core.services.auditoria_service import AuditoriaService


def _validar_payload(data: dict):
    if not isinstance(data, dict) or not data:
        raise ValueError("Los datos no pueden estar vacios.")


def _validar_id(valor, campo: str):
    if not isinstance(valor, int) or valor <= 0:
        raise ValueError(f"El campo '{campo}' debe ser un entero positivo.")
    return valor


def _validar_texto(valor: str, campo: str):
    if not isinstance(valor, str) or not valor.strip():
        raise ValueError(f"{campo} es obligatorio.")
    return valor.strip()


def _validar_procedencia(valor: str):
    valor = _validar_texto(valor, "La procedencia")

    if valor.isdigit():
        raise ValueError("La procedencia no puede ser numerica.")

    return valor


def _validar_fecha(fecha_str: str):
    try:
        fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        raise ValueError("El formato de la fecha debe ser YYYY-MM-DD.")

    if fecha > date.today():
        raise ValueError("La fecha no puede ser futura.")

    return fecha


def _validar_tipo_visita(tipo_visita_id):
    tipo_visita_id = _validar_id(tipo_visita_id, "tipo_visita_id")
    tipo_visita = db.session.get(TipoReunion, tipo_visita_id)
    if not tipo_visita:
        raise ValueError("Tipo de visita invalido.")
    return tipo_visita.id


def _validar_grupo(grupo_utn_id):
    grupo_utn_id = _validar_id(grupo_utn_id, "grupo_utn_id")
    grupo = db.session.get(GrupoInvestigacionUtn, grupo_utn_id)
    if not grupo or getattr(grupo, "deleted_at", None) is not None:
        raise ValueError("Grupo UTN invalido.")
    return grupo.id


def _get_or_404(visita_id: int):
    visita = db.session.get(VisitaAcademica, _validar_id(visita_id, "id"))
    if not visita:
        raise ValueError("Visita academica no encontrada.")
    return visita


def _get_activa_or_404(visita_id: int):
    visita = _get_or_404(visita_id)
    if visita.deleted_at is not None:
        raise ValueError("Visita academica no encontrada.")
    return visita


def crear_visita_academica(data, user_id=None):
    _validar_payload(data)

    if user_id is not None:
        _validar_id(user_id, "user_id")

    visita = VisitaAcademica(
        tipo_visita_id=_validar_tipo_visita(data.get("tipo_visita_id")),
        razon=_validar_texto(data.get("razon"), "La razon"),
        procedencia=_validar_procedencia(data.get("procedencia")),
        fecha=_validar_fecha(data.get("fecha")),
        grupo_utn_id=_validar_grupo(data.get("grupo_utn_id")),
        created_by=user_id
    )

    db.session.add(visita)
    try:
        db.session.commit()
        return visita
    except Exception:
        db.session.rollback()
        raise


def actualizar_visita_academica(id, data):
    _validar_payload(data)
    visita = _get_activa_or_404(id)
    cambios = {}

    if "tipo_visita_id" in data:
        nuevo_valor = _validar_tipo_visita(data["tipo_visita_id"])
        cambio = AuditoriaService.construir_cambio(
            visita.tipo_visita_id,
            nuevo_valor
        )
        if cambio:
            cambios["tipo_visita_id"] = cambio
            visita.tipo_visita_id = nuevo_valor

    if "razon" in data:
        nuevo_valor = _validar_texto(data["razon"], "La razon")
        cambio = AuditoriaService.construir_cambio(visita.razon, nuevo_valor)
        if cambio:
            cambios["razon"] = cambio
            visita.razon = nuevo_valor

    if "procedencia" in data:
        nuevo_valor = _validar_procedencia(data["procedencia"])
        cambio = AuditoriaService.construir_cambio(
            visita.procedencia,
            nuevo_valor
        )
        if cambio:
            cambios["procedencia"] = cambio
            visita.procedencia = nuevo_valor

    if "fecha" in data:
        nuevo_valor = _validar_fecha(data["fecha"])
        cambio = AuditoriaService.construir_cambio(visita.fecha, nuevo_valor)
        if cambio:
            cambios["fecha"] = cambio
            visita.fecha = nuevo_valor

    if "grupo_utn_id" in data:
        nuevo_valor = _validar_grupo(data["grupo_utn_id"])
        cambio = AuditoriaService.construir_cambio(
            visita.grupo_utn_id,
            nuevo_valor
        )
        if cambio:
            cambios["grupo_utn_id"] = cambio
            visita.grupo_utn_id = nuevo_valor

    user_id = data.get("user_id")
    if cambios and user_id is not None:
        _validar_id(user_id, "user_id")
        visita.mark_updated(user_id)
        AuditoriaService.registrar_cambios(
            entidad="visita_academica",
            registro_id=visita.id,
            cambios=cambios,
            user_id=user_id
        )

    try:
        db.session.commit()
        return visita
    except Exception:
        db.session.rollback()
        raise


def eliminar_visita_academica(id, user_id=None):
    if user_id is not None:
        _validar_id(user_id, "user_id")

    visita = _get_activa_or_404(id)
    visita.soft_delete(user_id)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def listar_visitas(activos="true"):
    query = VisitaAcademica.query

    if activos == "true":
        query = query.filter(VisitaAcademica.deleted_at.is_(None))
    elif activos == "false":
        query = query.filter(VisitaAcademica.deleted_at.isnot(None))
    elif activos == "all":
        pass
    else:
        query = query.filter(VisitaAcademica.deleted_at.is_(None))

    return query.all()


def obtener_visita_por_id(id):
    return _get_or_404(id)


def obtener_historial_visita(id):
    visita = _get_or_404(id)
    return AuditoriaService.obtener_historial_entidad(
        entidad="visita_academica",
        registro_id=visita.id
    )


def snapshot_visitas_para_memoria_version(memoria_version, user_id):
    visitas = VisitaAcademica.query.filter(
        VisitaAcademica.deleted_at.is_(None)
    ).all()

    snapshots = []
    for visita in visitas:
        snapshot = VisitaAcademicaMemoriaVersion(
            memoria_version_id=memoria_version.id,
            visita_academica_id=visita.id,
            razon=visita.razon,
            procedencia=visita.procedencia,
            fecha=visita.fecha,
            tipo_visita_id=visita.tipo_visita_id,
            tipo_visita_nombre=(
                visita.tipo_visita.nombre if visita.tipo_visita else None
            ),
            grupo_utn_id=visita.grupo_utn_id,
            grupo_utn_nombre=(
                visita.grupo_utn.nombre_sigla_grupo if visita.grupo_utn else None
            ),
            created_by=user_id
        )
        db.session.add(snapshot)
        snapshots.append(snapshot)

    return snapshots


def obtener_snapshots_visitas_por_memoria_version(memoria_version_id):
    snapshots = (
        VisitaAcademicaMemoriaVersion.query
        .filter(
            VisitaAcademicaMemoriaVersion.memoria_version_id == memoria_version_id,
            VisitaAcademicaMemoriaVersion.deleted_at.is_(None)
        )
        .order_by(
            VisitaAcademicaMemoriaVersion.fecha.desc(),
            VisitaAcademicaMemoriaVersion.id.desc()
        )
        .all()
    )

    return [snapshot.serialize() for snapshot in snapshots]
