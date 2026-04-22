from sqlalchemy import func

from extension import db
from core.models.personal import TipoFormacion


def _validar_id_positivo(tipo_formacion_id):
    if isinstance(tipo_formacion_id, bool) or not isinstance(tipo_formacion_id, int):
        raise ValueError("El id debe ser un entero positivo.")

    if tipo_formacion_id <= 0:
        raise ValueError("El id debe ser un entero positivo.")

    return tipo_formacion_id


def _validar_data(data):
    if data is None:
        raise ValueError("Los datos no pueden estar vacíos.")

    if not isinstance(data, dict):
        raise ValueError("Los datos deben enviarse en un objeto válido.")

    if not data:
        raise ValueError("Los datos no pueden estar vacíos.")

    return data


def _validar_nombre(nombre, tipo_formacion_id=None):
    if nombre is None:
        raise ValueError("El nombre es obligatorio.")

    if not isinstance(nombre, str):
        raise ValueError("El nombre debe ser un texto no vacío.")

    nombre = nombre.strip()
    if not nombre:
        raise ValueError("El nombre no puede estar vacío.")

    if len(nombre) < 2:
        raise ValueError("El nombre debe tener al menos 2 caracteres.")

    query = TipoFormacion.query.filter(
        func.lower(TipoFormacion.nombre) == nombre.lower()
    )

    if tipo_formacion_id is not None:
        query = query.filter(TipoFormacion.id != tipo_formacion_id)

    if query.first():
        raise ValueError("Ya existe un tipo de formación con ese nombre.")

    return nombre


def _obtener_tipo_formacion_o_error(tipo_formacion_id):
    tipo_formacion_id = _validar_id_positivo(tipo_formacion_id)
    tipo = TipoFormacion.query.get(tipo_formacion_id)

    if not tipo:
        raise ValueError("Tipo de formación no encontrado.")

    return tipo


def crear_tipo_formacion(data):
    data = _validar_data(data)
    nombre = _validar_nombre(data.get("nombre"))

    nuevo = TipoFormacion(nombre=nombre)
    db.session.add(nuevo)

    try:
        db.session.commit()
        return nuevo
    except Exception:
        db.session.rollback()
        raise


def actualizar_tipo_formacion(id, data):
    data = _validar_data(data)
    tipo = _obtener_tipo_formacion_o_error(id)
    nombre = _validar_nombre(data.get("nombre"), tipo_formacion_id=tipo.id)

    tipo.nombre = nombre

    try:
        db.session.commit()
        return tipo
    except Exception:
        db.session.rollback()
        raise


def eliminar_tipo_formacion(id):
    tipo = _obtener_tipo_formacion_o_error(id)

    if len(tipo.becarios) > 0:
        raise ValueError(
            "No se puede eliminar el tipo de formación porque está asociado a becarios."
        )

    db.session.delete(tipo)
    try:
        db.session.commit()
        return tipo
    except Exception:
        db.session.rollback()
        raise


def listar_tipos_formacion():
    return TipoFormacion.query.order_by(TipoFormacion.nombre.asc()).all()


def obtener_tipo_formacion_por_id(id):
    return _obtener_tipo_formacion_o_error(id)
