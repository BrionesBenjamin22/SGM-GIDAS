from datetime import date, datetime

from sqlalchemy import or_

from core.models.distinciones import DistincionRecibida
from core.models.proyecto_investigacion import ProyectoInvestigacion
from extension import db


class DistincionRecibidaService:

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
            raise ValueError(f"El campo '{campo}' es obligatorio")
        return " ".join(valor.strip().split())

    @staticmethod
    def _validar_user_id(user_id: int):
        return DistincionRecibidaService._validar_id(user_id, "user_id")

    @staticmethod
    def _normalizar_activos(activos):
        if activos is None:
            return "true"
        return str(activos).strip().lower()

    @staticmethod
    def _normalizar_orden(orden):
        if orden is None:
            return None
        return str(orden).strip().lower()

    @staticmethod
    def _parse_int_filter(valor, campo: str):
        if valor is None or valor == "":
            return None

        try:
            valor = int(valor)
        except (TypeError, ValueError):
            raise ValueError(f"El campo '{campo}' debe ser un entero positivo")

        return DistincionRecibidaService._validar_id(valor, campo)

    @staticmethod
    def _validar_fecha(fecha_str: str):
        try:
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            raise ValueError(
                "La fecha es obligatoria y debe tener formato YYYY-MM-DD"
            )

        if fecha > date.today():
            raise ValueError("La fecha no puede ser futura")

        return fecha

    @staticmethod
    def _validar_proyecto(proyecto_id):
        proyecto_id = DistincionRecibidaService._validar_id(
            proyecto_id, "proyecto_investigacion_id"
        )
        proyecto = db.session.get(ProyectoInvestigacion, proyecto_id)
        if not proyecto or proyecto.deleted_at is not None:
            raise ValueError("Proyecto de investigacion invalido")
        return proyecto.id

    @staticmethod
    def _get_or_404(distincion_id: int):
        distincion = db.session.get(
            DistincionRecibida,
            DistincionRecibidaService._validar_id(distincion_id, "distincion_id")
        )
        if not distincion:
            raise ValueError("Distincion no encontrada")
        return distincion

    @staticmethod
    def _get_activa_or_404(distincion_id: int):
        distincion = DistincionRecibidaService._get_or_404(distincion_id)
        if distincion.deleted_at is not None:
            raise ValueError("Distincion no encontrada")
        return distincion

    @staticmethod
    def _validar_no_duplicado(
        proyecto_id: int,
        descripcion: str,
        fecha,
        distincion_id: int = None
    ):
        query = DistincionRecibida.query.filter(
            DistincionRecibida.proyecto_investigacion_id == proyecto_id,
            DistincionRecibida.descripcion == descripcion,
            DistincionRecibida.fecha == fecha,
            DistincionRecibida.deleted_at.is_(None)
        )

        if distincion_id is not None:
            query = query.filter(DistincionRecibida.id != distincion_id)

        if query.first():
            raise ValueError(
                "Ya existe una distincion identica para ese proyecto en esa fecha"
            )

    @staticmethod
    def get_all(filters: dict = None):
        filters = filters or {}
        query = DistincionRecibida.query

        proyecto_id = DistincionRecibidaService._parse_int_filter(
            filters.get("proyecto_id"), "proyecto_id"
        )
        if proyecto_id is not None:
            query = query.filter(
                DistincionRecibida.proyecto_investigacion_id == proyecto_id
            )

        activos = DistincionRecibidaService._normalizar_activos(
            filters.get("activos")
        )
        if activos == "true":
            query = query.filter(
                DistincionRecibida.deleted_at.is_(None),
                DistincionRecibida.activo.is_(True)
            )
        elif activos == "false":
            query = query.filter(
                or_(
                    DistincionRecibida.deleted_at.isnot(None),
                    DistincionRecibida.activo.is_(False)
                )
            )
        elif activos != "all":
            query = query.filter(
                DistincionRecibida.deleted_at.is_(None),
                DistincionRecibida.activo.is_(True)
            )

        orden = DistincionRecibidaService._normalizar_orden(filters.get("orden"))
        if orden == "asc":
            query = query.order_by(DistincionRecibida.fecha.asc())
        else:
            query = query.order_by(DistincionRecibida.fecha.desc())

        return [d.serialize() for d in query.all()]

    @staticmethod
    def get_by_id(distincion_id: int):
        return DistincionRecibidaService._get_or_404(distincion_id).serialize()

    @staticmethod
    def create(data: dict, user_id: int):
        DistincionRecibidaService._validar_payload(data)
        DistincionRecibidaService._validar_user_id(user_id)

        fecha = DistincionRecibidaService._validar_fecha(data.get("fecha"))
        descripcion = DistincionRecibidaService._validar_texto(
            data.get("descripcion"), "descripcion"
        )
        proyecto_id = DistincionRecibidaService._validar_proyecto(
            data.get("proyecto_investigacion_id")
        )

        DistincionRecibidaService._validar_no_duplicado(
            proyecto_id,
            descripcion,
            fecha
        )

        dist = DistincionRecibida(
            fecha=fecha,
            descripcion=descripcion,
            proyecto_investigacion_id=proyecto_id,
            created_by=user_id
        )

        db.session.add(dist)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return dist.serialize()

    @staticmethod
    def update(distincion_id: int, data: dict):
        DistincionRecibidaService._validar_payload(data)
        dist = DistincionRecibidaService._get_activa_or_404(distincion_id)

        fecha = dist.fecha
        if "fecha" in data:
            fecha = DistincionRecibidaService._validar_fecha(data["fecha"])

        descripcion = dist.descripcion
        if "descripcion" in data:
            descripcion = DistincionRecibidaService._validar_texto(
                data["descripcion"], "descripcion"
            )

        proyecto_id = dist.proyecto_investigacion_id
        if "proyecto_investigacion_id" in data:
            proyecto_id = DistincionRecibidaService._validar_proyecto(
                data["proyecto_investigacion_id"]
            )

        DistincionRecibidaService._validar_no_duplicado(
            proyecto_id,
            descripcion,
            fecha,
            dist.id
        )

        dist.fecha = fecha
        dist.descripcion = descripcion
        dist.proyecto_investigacion_id = proyecto_id

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return dist.serialize()

    @staticmethod
    def delete(distincion_id: int, user_id: int):
        DistincionRecibidaService._validar_user_id(user_id)

        dist = DistincionRecibidaService._get_activa_or_404(distincion_id)
        dist.soft_delete(user_id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Distincion eliminada correctamente"}
