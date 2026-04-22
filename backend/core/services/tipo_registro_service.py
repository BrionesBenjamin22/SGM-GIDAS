from sqlalchemy import func
from core.models.registro_patente import TipoRegistroPropiedad
from extension import db


class TipoRegistroPropiedadService:

    @staticmethod
    def _validar_nombre(nombre, tipo_id=None):
        if not isinstance(nombre, str):
            raise Exception("El nombre es obligatorio")

        nombre = " ".join(nombre.strip().split())
        if not nombre:
            raise Exception("El nombre es obligatorio")

        query = TipoRegistroPropiedad.query.filter(
            func.lower(TipoRegistroPropiedad.nombre) == nombre.lower()
        )
        if tipo_id is not None:
            query = query.filter(TipoRegistroPropiedad.id != tipo_id)

        if query.first():
            raise Exception("Ya existe un tipo de registro con ese nombre")

        return nombre

    @staticmethod
    def get_all():
        return [
            t.serialize()
            for t in TipoRegistroPropiedad.query.order_by(
                TipoRegistroPropiedad.nombre.asc()
            ).all()
        ]

    @staticmethod
    def get_by_id(tipo_id: int):
        tipo = db.session.get(TipoRegistroPropiedad, tipo_id)
        if not tipo:
            raise Exception("Tipo de registro no encontrado")
        return tipo.serialize()

    @staticmethod
    def create(data: dict):
        if not data:
            raise Exception("Los datos no pueden estar vacios")

        nuevo = TipoRegistroPropiedad(
            nombre=TipoRegistroPropiedadService._validar_nombre(
                data.get("nombre")
            )
        )
        db.session.add(nuevo)
        db.session.commit()
        return nuevo.serialize()

    @staticmethod
    def update(tipo_id: int, data: dict):
        if not data:
            raise Exception("Los datos no pueden estar vacios")

        tipo = db.session.get(TipoRegistroPropiedad, tipo_id)
        if not tipo:
            raise Exception("Tipo de registro no encontrado")

        if "nombre" in data:
            tipo.nombre = TipoRegistroPropiedadService._validar_nombre(
                data["nombre"],
                tipo_id=tipo_id
            )

        db.session.commit()
        return tipo.serialize()

    @staticmethod
    def delete(tipo_id: int):
        tipo = db.session.get(TipoRegistroPropiedad, tipo_id)
        if not tipo:
            raise Exception("Tipo de registro no encontrado")

        if tipo.registros_propiedad:
            raise Exception(
                "No se puede eliminar el tipo de registro porque tiene registros asociados"
            )

        db.session.delete(tipo)
        db.session.commit()
        return {"message": "Tipo de registro eliminado correctamente"}
