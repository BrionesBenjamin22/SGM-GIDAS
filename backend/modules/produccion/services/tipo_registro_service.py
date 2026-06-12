from sqlalchemy import func
from modules.produccion.models.registro_patente import TipoRegistroPropiedad
from modules.shared.services.catalogo_auditoria_service import CatalogoAuditoriaService
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
    def get_all(activos="true"):
        query = TipoRegistroPropiedad.query
        if activos == "true":
            query = query.filter(TipoRegistroPropiedad.deleted_at.is_(None))
        elif activos == "false":
            query = query.filter(TipoRegistroPropiedad.deleted_at.isnot(None))
        return [
            t.serialize()
            for t in query.order_by(
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
    def create(data: dict, user_id=None):
        if not data:
            raise Exception("Los datos no pueden estar vacios")

        nuevo = TipoRegistroPropiedad(
            nombre=TipoRegistroPropiedadService._validar_nombre(
                data.get("nombre")
            )
        )
        CatalogoAuditoriaService.marcar_creacion(nuevo, user_id)
        db.session.add(nuevo)
        db.session.commit()
        return nuevo.serialize()

    @staticmethod
    def update(tipo_id: int, data: dict, user_id=None):
        if not data:
            raise Exception("Los datos no pueden estar vacios")

        tipo = db.session.get(TipoRegistroPropiedad, tipo_id)
        if not tipo:
            raise Exception("Tipo de registro no encontrado")

        if tipo.deleted_at is not None:
            raise Exception("No se puede editar un tipo de registro inactivo")

        if "nombre" in data:
            nombre = TipoRegistroPropiedadService._validar_nombre(
                data["nombre"],
                tipo_id=tipo_id
            )
            cambios = CatalogoAuditoriaService.construir_cambios(
                tipo,
                {"nombre": nombre}
            )
            tipo.nombre = nombre
            CatalogoAuditoriaService.marcar_actualizacion(tipo, cambios, user_id)

        db.session.commit()
        return tipo.serialize()

    @staticmethod
    def delete(tipo_id: int, user_id=None):
        tipo = db.session.get(TipoRegistroPropiedad, tipo_id)
        if not tipo:
            raise Exception("Tipo de registro no encontrado")

        if tipo.registros_propiedad:
            raise Exception(
                "No se puede eliminar el tipo de registro porque tiene registros asociados"
            )

        CatalogoAuditoriaService.marcar_baja(tipo, user_id)
        db.session.commit()
        return {"message": "Tipo de registro eliminado correctamente"}
