from sqlalchemy import func

from core.models.proyecto_investigacion import TipoProyecto
from extension import db


class TipoProyectoService:

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
            raise Exception("El nombre del tipo de proyecto es obligatorio")

        if not isinstance(nombre, str):
            raise Exception("El nombre debe ser texto")

        nombre = " ".join(nombre.strip().split())
        if not nombre:
            raise Exception("El nombre del tipo de proyecto es obligatorio")

        if len(nombre) < 2:
            raise Exception("El nombre debe tener al menos 2 caracteres")

        existente = TipoProyecto.query.filter(
            func.lower(TipoProyecto.nombre) == nombre.lower()
        )

        if tipo_id is not None:
            existente = existente.filter(TipoProyecto.id != tipo_id)

        if existente.first():
            raise Exception("Ya existe un tipo de proyecto con ese nombre")

        return nombre

    @staticmethod
    def _obtener_tipo_o_error(tipo_id):
        tipo_id = TipoProyectoService._validar_id_positivo(tipo_id)
        tipo = TipoProyecto.query.get(tipo_id)
        if not tipo:
            raise Exception("Tipo de proyecto no encontrado")
        return tipo

    @staticmethod
    def _serializar(tipo):
        return {
            "id": tipo.id,
            "nombre": tipo.nombre
        }

    @staticmethod
    def get_all():
        tipos = TipoProyecto.query.order_by(TipoProyecto.nombre.asc()).all()
        return [TipoProyectoService._serializar(t) for t in tipos]

    @staticmethod
    def get_by_id(tipo_id: int):
        tipo = TipoProyectoService._obtener_tipo_o_error(tipo_id)
        return TipoProyectoService._serializar(tipo)

    @staticmethod
    def create(data: dict):
        data = TipoProyectoService._validar_data(data)
        nombre = TipoProyectoService._validar_nombre(data.get("nombre"))

        tipo = TipoProyecto(nombre=nombre)

        db.session.add(tipo)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return TipoProyectoService._serializar(tipo)

    @staticmethod
    def update(tipo_id: int, data: dict):
        data = TipoProyectoService._validar_data(data)
        tipo = TipoProyectoService._obtener_tipo_o_error(tipo_id)
        tipo.nombre = TipoProyectoService._validar_nombre(data.get("nombre"), tipo.id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return TipoProyectoService._serializar(tipo)

    @staticmethod
    def delete(tipo_id: int):
        tipo = TipoProyectoService._obtener_tipo_o_error(tipo_id)

        if len(tipo.proyectos_investigacion) > 0:
            raise Exception(
                "No se puede eliminar el tipo porque tiene proyectos asociados"
            )

        db.session.delete(tipo)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Tipo de proyecto eliminado correctamente"}
