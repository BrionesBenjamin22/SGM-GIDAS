from sqlalchemy import func

from extension import db
from core.models.personal import TipoDedicacion


def _validar_id_positivo(tipo_dedicacion_id):
    if isinstance(tipo_dedicacion_id, bool) or not isinstance(tipo_dedicacion_id, int):
        raise ValueError("El id debe ser un entero positivo.")

    if tipo_dedicacion_id <= 0:
        raise ValueError("El id debe ser un entero positivo.")

    return tipo_dedicacion_id


def _validar_data(data):
    if data is None:
        raise ValueError("Los datos no pueden estar vacíos.")

    if not isinstance(data, dict):
        raise ValueError("Los datos deben enviarse en un objeto válido.")

    if not data:
        raise ValueError("Los datos no pueden estar vacíos.")

    return data


def _validar_nombre(nombre, tipo_dedicacion_id=None):
    if nombre is None:
        raise ValueError("El nombre es obligatorio.")

    if not isinstance(nombre, str):
        raise ValueError("El nombre debe ser un texto no vacío.")

    nombre = nombre.strip()
    if not nombre:
        raise ValueError("El nombre no puede estar vacío.")

    if len(nombre) < 2:
        raise ValueError("El nombre debe tener al menos 2 caracteres.")

    query = TipoDedicacion.query.filter(
        func.lower(TipoDedicacion.nombre) == nombre.lower()
    )

    if tipo_dedicacion_id is not None:
        query = query.filter(TipoDedicacion.id != tipo_dedicacion_id)

    if query.first():
        raise ValueError("Ya existe un tipo de dedicación con ese nombre.")

    return nombre


def _obtener_tipo_dedicacion_o_error(tipo_dedicacion_id):
    tipo_dedicacion_id = _validar_id_positivo(tipo_dedicacion_id)
    tipo = TipoDedicacion.query.get(tipo_dedicacion_id)

    if not tipo:
        raise ValueError("Tipo de dedicación no encontrado.")

    return tipo


def crear_tipo_dedicacion(data):
    data = _validar_data(data)
    nombre = _validar_nombre(data.get("nombre"))

    nuevo = TipoDedicacion(nombre=nombre)
    db.session.add(nuevo)

    try:
        db.session.commit()
        return nuevo
    except Exception:
        db.session.rollback()
        raise


def actualizar_tipo_dedicacion(id, data):
    data = _validar_data(data)
    tipo = _obtener_tipo_dedicacion_o_error(id)
    nombre = _validar_nombre(data.get("nombre"), tipo_dedicacion_id=tipo.id)

    tipo.nombre = nombre

    try:
        db.session.commit()
        return tipo
    except Exception:
        db.session.rollback()
        raise


def eliminar_tipo_dedicacion(id):
    tipo = _obtener_tipo_dedicacion_o_error(id)

    if len(tipo.investigadores) > 0:
        raise ValueError(
            "No se puede eliminar el tipo de dedicación porque está asociado a investigadores."
        )

    db.session.delete(tipo)
    try:
        db.session.commit()
        return tipo
    except Exception:
        db.session.rollback()
        raise


def listar_tipos_dedicacion():
    return TipoDedicacion.query.order_by(TipoDedicacion.nombre.asc()).all()



def obtener_tipo_dedicacion_por_id(id):
    return _obtener_tipo_dedicacion_o_error(id)
