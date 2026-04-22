from sqlalchemy import func

from core.models.erogacion import TipoErogacion
from extension import db


class TipoErogacionService:

    @staticmethod
    def _validar_id_positivo(tipo_id):
        if isinstance(tipo_id, bool) or not isinstance(tipo_id, int):
            raise Exception("El id debe ser un entero positivo")

        if tipo_id <= 0:
            raise Exception("El id debe ser un entero positivo")

        return tipo_id

    @staticmethod
    def _validar_data(data):
        if data is None:
            raise Exception("Los datos no pueden estar vacíos")

        if not isinstance(data, dict):
            raise Exception("Los datos deben enviarse en un objeto válido")

        if not data:
            raise Exception("Los datos no pueden estar vacíos")

        return data

    @staticmethod
    def _validar_nombre(nombre, tipo_id=None):
        if nombre is None:
            raise Exception("El nombre es obligatorio")

        if not isinstance(nombre, str):
            raise Exception("El nombre debe ser texto")

        nombre = nombre.strip()
        if not nombre:
            raise Exception("El nombre no puede estar vacío")

        if len(nombre) < 2:
            raise Exception("El nombre debe tener al menos 2 caracteres")

        existe = TipoErogacion.query.filter(
            func.lower(TipoErogacion.nombre) == nombre.lower()
        )

        if tipo_id is not None:
            existe = existe.filter(TipoErogacion.id != tipo_id)

        if existe.first():
            raise Exception("Ya existe un tipo de erogación con ese nombre")

        return nombre

    @staticmethod
    def _obtener_tipo_o_error(tipo_id):
        tipo_id = TipoErogacionService._validar_id_positivo(tipo_id)
        tipo = TipoErogacion.query.get(tipo_id)
        if not tipo:
            raise Exception("Tipo de erogación no encontrado")
        return tipo

    @staticmethod
    def get_all():
        return [t.serialize() for t in TipoErogacion.query.order_by(TipoErogacion.nombre.asc()).all()]

    @staticmethod
    def get_by_id(tipo_id: int):
        tipo = TipoErogacionService._obtener_tipo_o_error(tipo_id)
        return tipo.serialize()

    @staticmethod
    def create(data: dict):
        data = TipoErogacionService._validar_data(data)
        nombre = TipoErogacionService._validar_nombre(data.get("nombre"))

        nuevo = TipoErogacion(nombre=nombre)

        db.session.add(nuevo)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return nuevo.serialize()

    @staticmethod
    def update(tipo_id: int, data: dict):
        data = TipoErogacionService._validar_data(data)
        tipo = TipoErogacionService._obtener_tipo_o_error(tipo_id)
        tipo.nombre = TipoErogacionService._validar_nombre(data.get("nombre"), tipo.id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return tipo.serialize()

    @staticmethod
    def delete(tipo_id: int):
        tipo = TipoErogacionService._obtener_tipo_o_error(tipo_id)

        if len(tipo.erogaciones) > 0:
            raise Exception(
                "No se puede eliminar el tipo de erogación porque está asociado a erogaciones"
            )

        db.session.delete(tipo)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Tipo de erogación eliminado correctamente"}
