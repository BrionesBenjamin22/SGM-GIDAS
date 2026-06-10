from core.models.transferencia_socio import TipoContrato
from extension import db
from sqlalchemy import func


class TipoContratoService:

    # -------------------------------------------------
    # Validadores
    # -------------------------------------------------

    @staticmethod
    def _validar_id(tipo_contrato_id):
        if (
            isinstance(tipo_contrato_id, bool)
            or not isinstance(tipo_contrato_id, int)
            or tipo_contrato_id <= 0
        ):
            raise ValueError("El id debe ser un entero positivo")
        return tipo_contrato_id

    @staticmethod
    def _validar_payload(data):
        if data is None or not isinstance(data, dict) or not data:
            raise ValueError("Los datos no pueden estar vacios")
        return data

    @staticmethod
    def _validar_nombre(nombre, contrato_id=None):
        if nombre is None:
            raise ValueError("El nombre es obligatorio")

        if not isinstance(nombre, str):
            raise ValueError("El nombre debe ser texto")

        nombre = nombre.strip()

        if not nombre:
            raise ValueError("El nombre no puede estar vacio")

        if len(nombre) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")

        query = TipoContrato.query.filter(
            func.lower(TipoContrato.nombre) == nombre.lower()
        )

        if contrato_id is not None:
            query = query.filter(TipoContrato.id != contrato_id)

        if query.first():
            raise ValueError("Ya existe un tipo de contrato con ese nombre")

        return nombre

    @staticmethod
    def _get_or_404(tipo_contrato_id):
        tipo = TipoContrato.query.get(TipoContratoService._validar_id(tipo_contrato_id))
        if not tipo:
            raise ValueError("Tipo de contrato no encontrado")
        return tipo

    # -------------------------------------------------
    # CRUD
    # -------------------------------------------------

    @staticmethod
    def get_all():
        return [
            t.serialize()
            for t in TipoContrato.query.order_by(TipoContrato.nombre.asc()).all()
        ]

    @staticmethod
    def get_by_id(tipo_contrato_id):
        tipo = TipoContratoService._get_or_404(tipo_contrato_id)
        return tipo.serialize()

    @staticmethod
    def create(data: dict):
        TipoContratoService._validar_payload(data)
        nombre = TipoContratoService._validar_nombre(data.get("nombre"))

        tipo = TipoContrato(nombre=nombre)

        db.session.add(tipo)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return tipo.serialize()

    @staticmethod
    def update(tipo_contrato_id, data: dict):
        TipoContratoService._validar_payload(data)
        tipo = TipoContratoService._get_or_404(tipo_contrato_id)

        if "nombre" in data:
            tipo.nombre = TipoContratoService._validar_nombre(
                data["nombre"],
                contrato_id=tipo.id
            )

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return tipo.serialize()

    @staticmethod
    def delete(tipo_contrato_id):
        tipo = TipoContratoService._get_or_404(tipo_contrato_id)

        if any(t.deleted_at is None for t in tipo.transferencias):
            raise ValueError(
                "No se puede eliminar el tipo de contrato porque tiene transferencias asociadas"
            )

        db.session.delete(tipo)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Tipo de contrato eliminado correctamente"}
