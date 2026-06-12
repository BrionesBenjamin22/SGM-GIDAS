from sqlalchemy import func
from extension import db
from core.models.directivos import Cargo
from core.services.catalogo_auditoria_service import CatalogoAuditoriaService


class CargoService:

    @staticmethod
    def get_all(activos="true"):
        query = Cargo.query
        if activos == "true":
            query = query.filter(Cargo.deleted_at.is_(None))
        elif activos == "false":
            query = query.filter(Cargo.deleted_at.isnot(None))
        cargos = query.order_by(Cargo.nombre.asc()).all()
        return [c.serialize() for c in cargos]

    @staticmethod
    def get_by_id(cargo_id: int):
        cargo = db.session.get(Cargo, cargo_id)
        if not cargo:
            raise ValueError("Cargo no encontrado")
        return cargo.serialize()

    @staticmethod
    def _validar_nombre(nombre, cargo_id=None):
        if not isinstance(nombre, str):
            raise ValueError("El nombre es obligatorio")

        nombre = " ".join(nombre.strip().split())
        if not nombre:
            raise ValueError("El nombre es obligatorio")

        query = Cargo.query.filter(func.lower(Cargo.nombre) == nombre.lower())
        if cargo_id is not None:
            query = query.filter(Cargo.id != cargo_id)

        if query.first():
            raise ValueError("Ya existe un cargo con ese nombre")

        return nombre

    @staticmethod
    def create(data: dict, user_id=None):
        if not data:
            raise ValueError("Los datos no pueden estar vacios")

        cargo = Cargo(nombre=CargoService._validar_nombre(data.get("nombre")))
        CatalogoAuditoriaService.marcar_creacion(cargo, user_id)

        db.session.add(cargo)
        db.session.commit()

        return cargo.serialize()

    @staticmethod
    def update(cargo_id: int, data: dict, user_id=None):
        if not data:
            raise ValueError("Los datos no pueden estar vacios")

        cargo = db.session.get(Cargo, cargo_id)

        if not cargo:
            raise ValueError("Cargo no encontrado")

        if cargo.deleted_at is not None:
            raise ValueError("No se puede editar un cargo inactivo")

        if "nombre" in data:
            nombre = CargoService._validar_nombre(
                data.get("nombre"),
                cargo_id=cargo_id
            )
            cambios = CatalogoAuditoriaService.construir_cambios(
                cargo,
                {"nombre": nombre}
            )
            cargo.nombre = nombre
            CatalogoAuditoriaService.marcar_actualizacion(cargo, cambios, user_id)

        db.session.commit()

        return cargo.serialize()

    @staticmethod
    def delete(cargo_id: int, user_id=None):
        cargo = db.session.get(Cargo, cargo_id)

        if not cargo:
            raise ValueError("Cargo no encontrado")

        if cargo.participaciones:
            raise ValueError(
                "No se puede eliminar el cargo porque tiene participaciones asociadas"
            )

        CatalogoAuditoriaService.marcar_baja(cargo, user_id)
        db.session.commit()

        return {"message": "Cargo eliminado correctamente"}
