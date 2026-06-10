from extension import db
from core.models.tipo_personal import TipoPersonal


def crear_tipo_personal(data):
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
    db.session.add(nuevo_tipo)

    try:
        db.session.commit()
        return nuevo_tipo
    except Exception:
        db.session.rollback()
        raise


def actualizar_tipo_personal(id, data):
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

    tipo_personal.nombre = nombre

    try:
        db.session.commit()
        return tipo_personal
    except Exception:
        db.session.rollback()
        raise


def eliminar_tipo_personal(id):
    tipo_personal = TipoPersonal.query.get(id)
    if not tipo_personal:
        raise ValueError("Tipo de personal no encontrado.")

    if tipo_personal.personal.count() > 0:
        raise ValueError(
            "No se puede eliminar el tipo de personal porque está asociado a personal."
        )

    db.session.delete(tipo_personal)

    try:
        db.session.commit()
        return tipo_personal
    except Exception:
        db.session.rollback()
        raise


def listar_tipos():
    return TipoPersonal.query.all()


def obtener_tipo_por_id(id):
    tipo = TipoPersonal.query.get(id)
    if not tipo:
        raise ValueError("No se encontró un tipo con ese id")
    return tipo
