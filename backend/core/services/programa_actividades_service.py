from extension import db
from core.models.programa_actividades import PlanificacionGrupo
from core.models.grupo import GrupoInvestigacionUtn


def _validar_user_id(user_id):
    if not isinstance(user_id, int) or user_id <= 0:
        raise ValueError("El user_id es invalido.")


def _validar_descripcion(descripcion):
    if not isinstance(descripcion, str):
        raise ValueError("La descripcion es obligatoria.")

    descripcion = " ".join(descripcion.strip().split())
    if not descripcion:
        raise ValueError("La descripcion es obligatoria.")

    return descripcion


def _validar_anio(anio):
    if not isinstance(anio, int) or anio < 2000:
        raise ValueError("El anio es invalido.")

    return anio


def _obtener_grupo_activo(grupo_id):
    if not isinstance(grupo_id, int) or grupo_id <= 0:
        raise ValueError("Grupo UTN invalido.")

    grupo = db.session.get(GrupoInvestigacionUtn, grupo_id)
    if not grupo or grupo.deleted_at is not None:
        raise ValueError("Grupo UTN invalido.")

    return grupo


def _validar_planificacion_unica(grupo_id, anio, planificacion_id=None):
    query = PlanificacionGrupo.query.filter(
        PlanificacionGrupo.grupo_id == grupo_id,
        PlanificacionGrupo.anio == anio,
        PlanificacionGrupo.deleted_at.is_(None)
    )

    if planificacion_id is not None:
        query = query.filter(PlanificacionGrupo.id != planificacion_id)

    if query.first():
        raise ValueError(
            "Ya existe una planificacion para ese grupo en el anio indicado."
        )


def crear_planificacion_grupo(data, user_id):
    if not data:
        raise ValueError("Los datos no pueden estar vacios.")

    _validar_user_id(user_id)
    descripcion = _validar_descripcion(data.get("descripcion"))
    anio = _validar_anio(data.get("anio"))
    grupo = _obtener_grupo_activo(data.get("grupo_id"))
    _validar_planificacion_unica(grupo.id, anio)

    planificacion = PlanificacionGrupo(
        descripcion=descripcion,
        anio=anio,
        grupo_id=grupo.id,
        activo=True,
        created_by=user_id,
    )

    db.session.add(planificacion)
    try:
        db.session.commit()
        return planificacion
    except Exception:
        db.session.rollback()
        raise


def actualizar_planificacion_grupo(id, data):
    if not data:
        raise ValueError("Los datos no pueden estar vacios.")

    planificacion = db.session.get(PlanificacionGrupo, id)
    if not planificacion or planificacion.deleted_at is not None:
        raise ValueError("Planificacion no encontrada.")

    if "descripcion" in data:
        planificacion.descripcion = _validar_descripcion(data["descripcion"])

    nuevo_anio = planificacion.anio
    if "anio" in data:
        nuevo_anio = _validar_anio(data["anio"])

    nuevo_grupo_id = planificacion.grupo_id
    if "grupo_id" in data:
        nuevo_grupo_id = _obtener_grupo_activo(data["grupo_id"]).id

    if (
        nuevo_anio != planificacion.anio
        or nuevo_grupo_id != planificacion.grupo_id
    ):
        _validar_planificacion_unica(
            nuevo_grupo_id,
            nuevo_anio,
            planificacion_id=id
        )

    planificacion.anio = nuevo_anio
    planificacion.grupo_id = nuevo_grupo_id

    try:
        db.session.commit()
        return planificacion
    except Exception:
        db.session.rollback()
        raise


def eliminar_planificacion_grupo(id, user_id=None):
    _validar_user_id(user_id)

    planificacion = db.session.get(PlanificacionGrupo, id)
    if not planificacion or planificacion.deleted_at is not None:
        raise ValueError("Planificacion no encontrada.")

    if planificacion.proyectos_investigacion:
        raise ValueError(
            "No se puede eliminar la planificacion porque tiene proyectos asociados."
        )

    planificacion.soft_delete(user_id)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def listar_planificaciones(activos="true"):
    query = PlanificacionGrupo.query

    if activos is None:
        activos = "true"

    activos = activos.strip().lower()

    if activos == "true":
        query = query.filter(PlanificacionGrupo.deleted_at.is_(None))
    elif activos == "false":
        query = query.filter(PlanificacionGrupo.deleted_at.isnot(None))
    elif activos == "all":
        pass
    else:
        query = query.filter(PlanificacionGrupo.deleted_at.is_(None))

    return query.all()


def obtener_planificacion_por_id(id):
    planificacion = db.session.get(PlanificacionGrupo, id)
    if not planificacion or planificacion.deleted_at is not None:
        raise ValueError("Planificacion no encontrada.")
    return planificacion
