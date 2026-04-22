from datetime import datetime, date

from core.models.equipamiento import Equipamiento
from core.models.grupo import GrupoInvestigacionUtn
from extension import db


class EquipamientoService:

    # ==========================================
    # HELPERS
    # ==========================================

    @staticmethod
    def _validar_payload(data: dict):
        if not isinstance(data, dict) or not data:
            raise ValueError("Los datos no pueden estar vacios")

    @staticmethod
    def _validar_id(valor, campo: str):
        if not isinstance(valor, int) or valor <= 0:
            raise ValueError(f"El campo '{campo}' debe ser un entero positivo")
        return valor

    @staticmethod
    def _validar_texto(valor: str, campo: str):
        if not isinstance(valor, str) or not valor.strip():
            raise ValueError(f"{campo} es obligatorio")
        return valor.strip()

    @staticmethod
    def _validar_monto(monto):
        try:
            monto = float(monto)
        except (TypeError, ValueError):
            raise ValueError("El monto debe ser numerico.")

        if monto <= 0:
            raise ValueError("El monto debe ser mayor a 0.")

        return monto

    @staticmethod
    def _validar_fecha(fecha_str: str):
        try:
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            raise ValueError("Formato de fecha invalido. Usar YYYY-MM-DD.")

        if fecha > date.today():
            raise ValueError("La fecha de incorporacion no puede ser futura.")

        return fecha

    @staticmethod
    def _validar_grupo(grupo_id):
        grupo_id = EquipamientoService._validar_id(grupo_id, "grupo_utn_id")
        grupo = db.session.get(GrupoInvestigacionUtn, grupo_id)
        if not grupo or grupo.deleted_at is not None:
            raise ValueError("Grupo no valido.")
        return grupo.id

    @staticmethod
    def _get_activo_or_404(equipamiento_id: int):
        equipamiento = db.session.get(
            Equipamiento,
            EquipamientoService._validar_id(equipamiento_id, "equipamiento_id")
        )
        if not equipamiento or equipamiento.deleted_at is not None:
            raise Exception("Equipamiento no encontrado")
        return equipamiento

    # ==========================================
    # GET ALL
    # ==========================================

    @staticmethod
    def get_all(activos: str = "true"):
        query = Equipamiento.query

        if activos == "true":
            query = query.filter(Equipamiento.deleted_at.is_(None))
        elif activos == "false":
            query = query.filter(Equipamiento.deleted_at.isnot(None))
        elif activos == "all":
            pass
        else:
            query = query.filter(Equipamiento.deleted_at.is_(None))

        equipamientos = query.all()
        return [e.serialize() for e in equipamientos]

    # ==========================================
    # GET BY ID
    # ==========================================

    @staticmethod
    def get_by_id(equipamiento_id: int):
        equipamiento = db.session.get(
            Equipamiento,
            EquipamientoService._validar_id(equipamiento_id, "equipamiento_id")
        )
        if not equipamiento:
            raise Exception("Equipamiento no encontrado")
        return equipamiento.serialize()

    # ==========================================
    # CREATE
    # ==========================================

    @staticmethod
    def create(data: dict, user_id: int):
        EquipamientoService._validar_payload(data)
        EquipamientoService._validar_id(user_id, "user_id")

        equipamiento = Equipamiento(
            denominacion=EquipamientoService._validar_texto(
                data.get("denominacion"), "La denominacion"
            ),
            descripcion_breve=EquipamientoService._validar_texto(
                data.get("descripcion_breve"), "La descripcion"
            ),
            fecha_incorporacion=EquipamientoService._validar_fecha(
                data.get("fecha_incorporacion")
            ),
            monto_invertido=EquipamientoService._validar_monto(
                data.get("monto_invertido")
            ),
            grupo_utn_id=EquipamientoService._validar_grupo(
                data.get("grupo_utn_id")
            ),
            created_by=user_id
        )

        db.session.add(equipamiento)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return equipamiento.serialize()

    # ==========================================
    # UPDATE
    # ==========================================

    @staticmethod
    def update(equipamiento_id: int, data: dict):
        EquipamientoService._validar_payload(data)
        equipamiento = EquipamientoService._get_activo_or_404(equipamiento_id)

        if "denominacion" in data:
            equipamiento.denominacion = EquipamientoService._validar_texto(
                data["denominacion"], "La denominacion"
            )

        if "descripcion_breve" in data:
            equipamiento.descripcion_breve = EquipamientoService._validar_texto(
                data["descripcion_breve"], "La descripcion"
            )

        if "monto_invertido" in data:
            equipamiento.monto_invertido = EquipamientoService._validar_monto(
                data["monto_invertido"]
            )

        if "fecha_incorporacion" in data:
            equipamiento.fecha_incorporacion = EquipamientoService._validar_fecha(
                data["fecha_incorporacion"]
            )

        if "grupo_utn_id" in data:
            equipamiento.grupo_utn_id = EquipamientoService._validar_grupo(
                data["grupo_utn_id"]
            )

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return equipamiento.serialize()

    # ==========================================
    # SOFT DELETE
    # ==========================================

    @staticmethod
    def delete(equipamiento_id: int, user_id: int):
        EquipamientoService._validar_id(user_id, "user_id")
        equipamiento = EquipamientoService._get_activo_or_404(equipamiento_id)

        equipamiento.soft_delete(user_id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Equipamiento eliminado correctamente"}
