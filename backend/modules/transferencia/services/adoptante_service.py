from modules.transferencia.models.transferencia_socio import Adoptante, AdoptanteTransferencia, TransferenciaSocioProductiva
from extension import db
from modules.shared.services.text_validation import has_only_letters_and_spaces
from datetime import datetime
from modules.shared.exceptions import ConflictError, NotFoundError, ValidationError as ValueError
from modules.shared.services.auditoria_service import AuditoriaService
from sqlalchemy import func


class AdoptanteService:

    # -------------------------------------------------
    # Helpers
    # -------------------------------------------------

    @staticmethod
    def _get_or_404(adoptante_id: int):
        adoptante = db.session.get(Adoptante, adoptante_id)

        if not adoptante or adoptante.deleted_at is not None:
            raise NotFoundError("Adoptante no encontrado.")

        return adoptante

    # -------------------------------------------------
    # Queries
    # -------------------------------------------------

    @staticmethod
    def get_all(activos: str = "true"):
        if activos not in {"true", "false", "all"}:
            raise ValueError("El filtro de estado no es válido.")
        query = Adoptante.query
        if activos == "true":
            query = query.filter(Adoptante.deleted_at.is_(None))
        elif activos == "false":
            query = query.filter(Adoptante.deleted_at.is_not(None))
        adoptantes = query.order_by(Adoptante.nombre.asc()).all()

        return [a.serialize() for a in adoptantes]

    @staticmethod
    def get_by_id(adoptante_id: int):
        adoptante = AdoptanteService._get_or_404(adoptante_id)
        return adoptante.serialize()

    @staticmethod
    def get_historial(adoptante_id: int):
        adoptante = db.session.get(Adoptante, adoptante_id)
        if not adoptante:
            raise NotFoundError("Adoptante no encontrado.")
        return AuditoriaService.obtener_historial_entidad("adoptante", adoptante.id)

    # -------------------------------------------------
    # Create
    # -------------------------------------------------

    @staticmethod
    def create(data: dict, user_id: int):
        if not data:
            raise ValueError("El body es obligatorio.")

        nombre = data.get("nombre")

        if not isinstance(nombre, str) or not nombre.strip():
            raise ValueError("El nombre es obligatorio.", details={"fields": {"nombre": "Ingrese el nombre del adoptante"}})

        if not has_only_letters_and_spaces(nombre):
            raise ValueError("Use solo letras y espacios en el nombre.", details={"fields": {"nombre": "Use solo letras y espacios en el nombre"}})

        nombre = nombre.strip()

        # Verificar duplicado SOLO entre activos
        existente = (
            Adoptante.query
            .filter(
                func.lower(Adoptante.nombre) == nombre.lower(),
                Adoptante.deleted_at.is_(None)
            )
            .first()
        )

        if existente:
            raise ConflictError("Ya existe un adoptante con ese nombre.", details={"fields": {"nombre": "Elija otro nombre o seleccione el adoptante existente"}})

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
    def update(adoptante_id: int, data: dict, user_id: int | None = None):
        if not data:
            raise ValueError("El body es obligatorio.")

        adoptante = AdoptanteService._get_or_404(adoptante_id)

        if "nombre" in data:
            nombre = data["nombre"]

            if not isinstance(nombre, str) or not nombre.strip():
                raise ValueError("El nombre es obligatorio.", details={"fields": {"nombre": "Ingrese el nombre del adoptante"}})

            if not has_only_letters_and_spaces(nombre):
                raise ValueError("Use solo letras y espacios en el nombre.", details={"fields": {"nombre": "Use solo letras y espacios en el nombre"}})

            nombre = nombre.strip()
            if nombre != adoptante.nombre:
                duplicate = Adoptante.query.filter(
                    Adoptante.id != adoptante.id,
                    func.lower(Adoptante.nombre) == nombre.lower(),
                    Adoptante.deleted_at.is_(None),
                ).first()
                if duplicate:
                    raise ConflictError("Ya existe un adoptante con ese nombre.", details={"fields": {"nombre": "Elija otro nombre."}})
                cambio = AuditoriaService.construir_cambio(adoptante.nombre, nombre)
                adoptante.nombre = nombre
                adoptante.mark_updated(user_id)
                AuditoriaService.registrar_cambios(
                    "adoptante", adoptante.id, {"nombre": cambio}, user_id=user_id
                )

        db.session.commit()

        return adoptante.serialize()

    # -------------------------------------------------
    # Soft Delete
    # -------------------------------------------------

    @staticmethod
    def delete(adoptante_id: int, user_id: int):

        adoptante = db.session.get(Adoptante, adoptante_id)

        if not adoptante or adoptante.deleted_at is not None:
            raise NotFoundError("Adoptante no encontrado.")

        active_link = db.session.query(AdoptanteTransferencia.id).join(
            TransferenciaSocioProductiva,
            AdoptanteTransferencia.transferencia_id == TransferenciaSocioProductiva.id,
        ).filter(
            AdoptanteTransferencia.adoptante_id == adoptante_id,
            AdoptanteTransferencia.deleted_at.is_(None),
            TransferenciaSocioProductiva.deleted_at.is_(None),
        ).first()
        if active_link:
            raise ConflictError("No se puede eliminar el adoptante porque está vinculado a una transferencia activa.")

        adoptante.soft_delete(user_id)
        AuditoriaService.registrar_cambios(
            "adoptante", adoptante.id,
            {"activo": AuditoriaService.construir_cambio(True, False)},
            user_id=user_id,
        )

        db.session.commit()

        return {"message": "Adoptante eliminado correctamente."}
