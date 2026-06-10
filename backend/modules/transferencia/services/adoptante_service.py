from core.models.transferencia_socio import Adoptante
from extension import db
from datetime import datetime


class AdoptanteService:

    # -------------------------------------------------
    # Helpers
    # -------------------------------------------------

    @staticmethod
    def _get_or_404(adoptante_id: int):
        adoptante = db.session.get(Adoptante, adoptante_id)

        if not adoptante or adoptante.deleted_at is not None:
            raise ValueError("Adoptante no encontrado.")

        return adoptante

    # -------------------------------------------------
    # Queries
    # -------------------------------------------------

    @staticmethod
    def get_all():
        adoptantes = (
            Adoptante.query
            .filter(Adoptante.deleted_at.is_(None))
            .order_by(Adoptante.nombre.asc())
            .all()
        )

        return [a.serialize() for a in adoptantes]

    @staticmethod
    def get_by_id(adoptante_id: int):
        adoptante = AdoptanteService._get_or_404(adoptante_id)
        return adoptante.serialize()

    # -------------------------------------------------
    # Create
    # -------------------------------------------------

    @staticmethod
    def create(data: dict, user_id: int):
        if not data:
            raise ValueError("El body es obligatorio.")

        nombre = data.get("nombre")

        if not isinstance(nombre, str) or not nombre.strip():
            raise ValueError("El nombre es obligatorio y debe ser una cadena no vacía.")

        nombre = nombre.strip()

        # Verificar duplicado SOLO entre activos
        existente = (
            Adoptante.query
            .filter(
                Adoptante.nombre == nombre,
                Adoptante.deleted_at.is_(None)
            )
            .first()
        )

        if existente:
            raise ValueError("Ya existe un adoptante con ese nombre.")

        adoptante = Adoptante(
            nombre=nombre,
            created_by=user_id
        )

        db.session.add(adoptante)
        db.session.commit()

        return adoptante.serialize()

    # -------------------------------------------------
    # Update
    # -------------------------------------------------

    @staticmethod
    def update(adoptante_id: int, data: dict):
        if not data:
            raise ValueError("El body es obligatorio.")

        adoptante = AdoptanteService._get_or_404(adoptante_id)

        if "nombre" in data:
            nombre = data["nombre"]

            if not isinstance(nombre, str) or not nombre.strip():
                raise ValueError("El nombre debe ser una cadena no vacía.")

            adoptante.nombre = nombre.strip()

        db.session.commit()

        return adoptante.serialize()

    # -------------------------------------------------
    # Soft Delete
    # -------------------------------------------------

    @staticmethod
    def delete(adoptante_id: int, user_id: int):

        adoptante = db.session.get(Adoptante, adoptante_id)

        if not adoptante or adoptante.deleted_at is not None:
            raise ValueError("Adoptante no encontrado.")

        adoptante.soft_delete(user_id)

        db.session.commit()

        return {"message": "Adoptante eliminado correctamente."}