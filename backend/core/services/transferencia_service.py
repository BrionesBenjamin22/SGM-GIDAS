from datetime import datetime
from extension import db

from core.models.transferencia_socio import (
    Adoptante,
    TransferenciaSocioProductiva,
    TipoContrato,
    AdoptanteTransferencia
)
from core.models.grupo import GrupoInvestigacionUtn


class TransferenciaSocioProductivaService:

    # =================================================
    # VALIDADORES
    # =================================================

    @staticmethod
    def _validar_texto(valor, campo, min_len=3):
        if valor is None:
            raise ValueError(f"El campo '{campo}' es obligatorio")

        if not isinstance(valor, str):
            raise ValueError(f"El campo '{campo}' debe ser texto")

        valor = valor.strip()

        if not valor:
            raise ValueError(f"El campo '{campo}' no puede estar vacío")

        if len(valor) < min_len:
            raise ValueError(
                f"El campo '{campo}' debe tener al menos {min_len} caracteres"
            )

        return valor


    @staticmethod
    def _validar_monto(monto):
        try:
            monto = float(monto)
        except (TypeError, ValueError):
            raise ValueError("El monto debe ser numérico")

        if monto <= 0:
            raise ValueError("El monto debe ser mayor a 0")

        return monto


    # =================================================
    # GET ALL
    # =================================================

    @staticmethod
    def get_all(filters: dict = None):
        query = db.session.query(TransferenciaSocioProductiva)
        filters = filters or {}

        activos = filters.get("activos", "true")

        if activos == "true":
            query = query.filter(
                TransferenciaSocioProductiva.deleted_at.is_(None)
            )
        elif activos == "false":
            query = query.filter(
                TransferenciaSocioProductiva.deleted_at.isnot(None)
            )
        elif activos == "all":
            pass

        if filters.get("grupo_utn_id"):
            query = query.filter(
                TransferenciaSocioProductiva.grupo_utn_id == filters["grupo_utn_id"]
            )

        if filters.get("tipo_contrato_id"):
            query = query.filter(
                TransferenciaSocioProductiva.tipo_contrato_id == filters["tipo_contrato_id"]
            )

        return [t.serialize() for t in query.all()]


    # =================================================
    # GET BY ID
    # =================================================

    @staticmethod
    def get_by_id(transferencia_id):

        transferencia = db.session.get(
            TransferenciaSocioProductiva,
            transferencia_id
        )

        if not transferencia:
            raise ValueError("Transferencia socio-productiva no encontrada")

        return transferencia.serialize()


    # =================================================
    # CREATE
    # =================================================

    @staticmethod
    def create(data: dict, user_id: int):

        numero_transferencia = data.get("numero_transferencia")
        if not isinstance(numero_transferencia, int) or numero_transferencia <= 0:
            raise ValueError("El número de transferencia debe ser un entero positivo")

        denominacion = TransferenciaSocioProductivaService._validar_texto(
            data.get("denominacion"), "denominacion"
        )

        demandante = TransferenciaSocioProductivaService._validar_texto(
            data.get("demandante"), "demandante"
        )

        descripcion_actividad = TransferenciaSocioProductivaService._validar_texto(
            data.get("descripcion_actividad"),
            "descripcion_actividad",
            min_len=10
        )

        monto = TransferenciaSocioProductivaService._validar_monto(
            data.get("monto")
        )

        fecha_inicio = datetime.strptime(
            data["fecha_inicio"],
            "%Y-%m-%d"
        ).date()

        fecha_fin = None
        if data.get("fecha_fin"):
            fecha_fin = datetime.strptime(
                data["fecha_fin"],
                "%Y-%m-%d"
            ).date()

            if fecha_fin < fecha_inicio:
                raise ValueError("La fecha_fin no puede ser anterior a fecha_inicio")

        # Validar relaciones
        tipo_contrato_id = data.get("tipo_contrato_id")
        if not tipo_contrato_id or not TipoContrato.query.get(tipo_contrato_id):
            raise ValueError("Tipo de contrato inválido")

        grupo_utn_id = data.get("grupo_utn_id")
        if not grupo_utn_id or not GrupoInvestigacionUtn.query.get(grupo_utn_id):
            raise ValueError("Grupo UTN inválido")

        transferencia = TransferenciaSocioProductiva(
            numero_transferencia=numero_transferencia,
            denominacion=denominacion,
            demandante=demandante,
            descripcion_actividad=descripcion_actividad,
            monto=monto,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            tipo_contrato_id=tipo_contrato_id,
            grupo_utn_id=grupo_utn_id,
            created_by=user_id
        )

        db.session.add(transferencia)
        db.session.commit()

        return transferencia.serialize()


    # =================================================
    # UPDATE
    # =================================================

    @staticmethod
    def update(transferencia_id, data: dict):

        transferencia = db.session.get(
            TransferenciaSocioProductiva,
            transferencia_id
        )

        if not transferencia:
            raise ValueError("Transferencia socio-productiva no encontrada")

        if transferencia.deleted_at is not None:
            raise ValueError("No se puede modificar una transferencia eliminada")

        if "denominacion" in data:
            transferencia.denominacion = TransferenciaSocioProductivaService._validar_texto(
                data["denominacion"], "denominacion"
            )

        if "demandante" in data:
            transferencia.demandante = TransferenciaSocioProductivaService._validar_texto(
                data["demandante"], "demandante"
            )

        if "descripcion_actividad" in data:
            transferencia.descripcion_actividad = TransferenciaSocioProductivaService._validar_texto(
                data["descripcion_actividad"],
                "descripcion_actividad",
                min_len=10
            )

        if "monto" in data:
            transferencia.monto = TransferenciaSocioProductivaService._validar_monto(
                data["monto"]
            )

        if "fecha_inicio" in data:
            transferencia.fecha_inicio = datetime.strptime(
                data["fecha_inicio"],
                "%Y-%m-%d"
            ).date()

        if "fecha_fin" in data:
            transferencia.fecha_fin = (
                datetime.strptime(data["fecha_fin"], "%Y-%m-%d").date()
                if data["fecha_fin"] else None
            )

        db.session.commit()
        return transferencia.serialize()


    # =================================================
    # SOFT DELETE
    # =================================================

    @staticmethod
    def delete(transferencia_id, user_id: int):

        transferencia = db.session.get(
            TransferenciaSocioProductiva,
            transferencia_id
        )

        if not transferencia:
            raise ValueError("Transferencia socio-productiva no encontrada")

        if transferencia.deleted_at is not None:
            raise ValueError("La transferencia ya está eliminada")

        transferencia.soft_delete(user_id)

        db.session.commit()

        return {"message": "Transferencia eliminada correctamente (soft delete)"}


    # =================================================
    # RESTORE
    # =================================================

    @staticmethod
    def restore(transferencia_id):

        transferencia = db.session.get(
            TransferenciaSocioProductiva,
            transferencia_id
        )

        if not transferencia:
            raise ValueError("Transferencia no encontrada")

        transferencia.restore()
        transferencia.activo = True

        db.session.commit()

        return transferencia.serialize()


    # =================================================
    # VINCULAR ADOPTANTES (M:N con entidad intermedia)
    # =================================================

    @staticmethod
    def add_adoptantes(transferencia_id: int, adoptantes_ids: list[int], user_id: int):

        if not isinstance(adoptantes_ids, list) or not adoptantes_ids:
            raise ValueError("adoptantes_ids debe ser una lista no vacía")

        transferencia = db.session.get(
            TransferenciaSocioProductiva,
            transferencia_id
        )

        if not transferencia:
            raise ValueError("Transferencia no encontrada")

        adoptantes = (
            db.session.query(Adoptante)
            .filter(
                Adoptante.id.in_(adoptantes_ids),
                Adoptante.deleted_at.is_(None)
            )
            .all()
        )

        if len(adoptantes) != len(adoptantes_ids):
            raise ValueError("Uno o más adoptantes no existen o están eliminados")

        for adoptante in adoptantes:

            existente = db.session.query(AdoptanteTransferencia).filter(
                AdoptanteTransferencia.transferencia_id == transferencia_id,
                AdoptanteTransferencia.adoptante_id == adoptante.id,
                AdoptanteTransferencia.deleted_at.is_(None)
            ).first()

            if existente:
                continue

            nueva = AdoptanteTransferencia(
                transferencia_id=transferencia_id,
                adoptante_id=adoptante.id,
                created_by=user_id
            )

            db.session.add(nueva)

        db.session.commit()

        return transferencia.serialize()


    # =================================================
    # DESVINCULAR ADOPTANTES (SOFT DELETE)
    # =================================================

    @staticmethod
    def remove_adoptantes(transferencia_id: int, adoptantes_ids: list[int], user_id: int):

        if not isinstance(adoptantes_ids, list) or not adoptantes_ids:
            raise ValueError("adoptantes_ids debe ser una lista no vacía")

        for adoptante_id in adoptantes_ids:

            participacion = db.session.query(AdoptanteTransferencia).filter(
                AdoptanteTransferencia.transferencia_id == transferencia_id,
                AdoptanteTransferencia.adoptante_id == adoptante_id,
                AdoptanteTransferencia.deleted_at.is_(None)
            ).first()

            if participacion:
                participacion.soft_delete(user_id)

        db.session.commit()

        transferencia = db.session.get(
            TransferenciaSocioProductiva,
            transferencia_id
        )

        return transferencia.serialize()