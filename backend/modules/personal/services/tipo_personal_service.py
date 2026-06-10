from extension import db
from core.models.tipo_personal import TipoPersonal
from core.services.catalogo_auditoria_service import CatalogoAuditoriaService


def crear_tipo_personal(data, user_id=None):
    if not data:
        raise ValueError("Los datos no pueden estar vacíos.")

    nombre = data.get('nombre')
    if not nombre or not isinstance(nombre, str):
        raise ValueError("El nombre debe ser un texto no vacío.")

    nombre = nombre.strip()
    if not nombre:
        raise ValueError("El nombre no puede estar vacío.")

    if TipoPersonal.query.filter_by(nombre=nombre).first():
        raise ValueError("Ya existe un tipo de personal con ese nombre.")

    nuevo_tipo = TipoPersonal(nombre=nombre)
    CatalogoAuditoriaService.marcar_creacion(nuevo_tipo, user_id)
    db.session.add(nuevo_tipo)

    try:
        db.session.commit()
        return nuevo_tipo
    except Exception:
        db.session.rollback()
        raise


def actualizar_tipo_personal(id, data, user_id=None):
    tipo_personal = TipoPersonal.query.get(id)
    if not tipo_personal:
        raise ValueError("Tipo de personal no encontrado.")

    nombre = data.get('nombre')
    if not nombre or not isinstance(nombre, str):
        raise ValueError("El nombre debe ser un texto no vacío.")

    nombre = nombre.strip()
    if not nombre:
        raise ValueError("El nombre no puede estar vacío.")

    duplicado = TipoPersonal.query.filter(
        TipoPersonal.nombre == nombre,
        TipoPersonal.id != id
    ).first()

    if duplicado:
        raise ValueError("Ya existe un tipo de personal con ese nombre.")

    cambios = CatalogoAuditoriaService.construir_cambios(
        tipo_personal,
        {"nombre": nombre}
    )
    tipo_personal.nombre = nombre
    CatalogoAuditoriaService.marcar_actualizacion(tipo_personal, cambios, user_id)

    try:
        db.session.commit()
        return tipo_personal
    except Exception:
        db.session.rollback()
        raise


def eliminar_tipo_personal(id, user_id=None):
    tipo_personal = TipoPersonal.query.get(id)
    if not tipo_personal:
        raise ValueError("Tipo de personal no encontrado.")

    if tipo_personal.personal.count() > 0:
        raise ValueError(
            "No se puede eliminar el tipo de personal porque está asociado a personal."
        )

    CatalogoAuditoriaService.marcar_baja(tipo_personal, user_id)

    try:
        db.session.commit()
        return tipo_personal
    except Exception:
        db.session.rollback()
        raise


def listar_tipos(activos="true"):
    query = TipoPersonal.query
    if activos == "true":
        query = query.filter(TipoPersonal.deleted_at.is_(None))
    elif activos == "false":
        query = query.filter(TipoPersonal.deleted_at.isnot(None))
    return query.order_by(TipoPersonal.nombre.asc()).all()


def obtener_tipo_por_id(id):
    tipo = TipoPersonal.query.get(id)
    if not tipo:
        raise ValueError("No se encontró un tipo con ese id")
    return tipo
