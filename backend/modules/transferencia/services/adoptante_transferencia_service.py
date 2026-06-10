from core.models.transferencia_socio import (
    AdoptanteTransferencia,
    Adoptante,
    TransferenciaSocioProductiva
)
from extension import db


class AdoptanteTransferenciaService:

    @staticmethod
    def vincular(adoptante_id: int, transferencia_id: int, user_id: int):

        # Verificar existencia
        adoptante = db.session.get(Adoptante, adoptante_id)
        transferencia = db.session.get(TransferenciaSocioProductiva, transferencia_id)

        if not adoptante or adoptante.deleted_at:
            raise ValueError("Adoptante inválido.")

        if not transferencia or transferencia.deleted_at:
            raise ValueError("Transferencia inválida.")

        # Buscar relación existente (activa o eliminada)
        relacion = (
            AdoptanteTransferencia.query
            .filter_by(
                adoptante_id=adoptante_id,
                transferencia_id=transferencia_id
            )
            .first()
        )

        if relacion:
            if relacion.deleted_at is None:
                raise ValueError("El adoptante ya está vinculado a la transferencia.")
            else:
                # Restaurar
                relacion.restore()
                db.session.commit()
                return {"message": "Relación restaurada correctamente."}

        nueva = AdoptanteTransferencia(
            adoptante_id=adoptante_id,
            transferencia_id=transferencia_id,
            created_by=user_id
        )

        db.session.add(nueva)
        db.session.commit()

        return {"message": "Adoptante vinculado correctamente."}

    @staticmethod
    def desvincular(adoptante_id: int, transferencia_id: int, user_id: int):

        relacion = (
            AdoptanteTransferencia.query
            .filter(
                AdoptanteTransferencia.adoptante_id == adoptante_id,
                AdoptanteTransferencia.transferencia_id == transferencia_id,
                AdoptanteTransferencia.deleted_at.is_(None)
            )
            .first()
        )

        if not relacion:
            raise ValueError("La relación no existe.")

        relacion.soft_delete(user_id)

        db.session.commit()

        return {"message": "Adoptante desvinculado correctamente."}