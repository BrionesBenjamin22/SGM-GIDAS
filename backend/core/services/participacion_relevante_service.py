from datetime import date, datetime
import unicodedata

from core.models.participacion_relevante import ParticipacionRelevante
from core.models.personal import Investigador
from extension import db


def normalizar_texto(texto: str) -> str:
    texto = texto.strip().lower()
    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    texto = " ".join(texto.split())
    return texto


class ParticipacionRelevanteService:

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

        return ParticipacionRelevanteService._validar_id(valor, campo)

    @staticmethod
    def _validar_texto(valor: str, campo: str):
        if not isinstance(valor, str) or not valor.strip():
            raise ValueError(f"El campo '{campo}' es obligatorio")
        return valor.strip()

    @staticmethod
    def _validar_user_id(user_id: int):
        return ParticipacionRelevanteService._validar_id(user_id, "user_id")

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
    def _validar_investigador(investigador_id):
        investigador_id = ParticipacionRelevanteService._validar_id(
            investigador_id, "investigador_id"
        )
        investigador = db.session.get(Investigador, investigador_id)
        if not investigador or investigador.deleted_at is not None:
            raise ValueError("Investigador invalido")
        return investigador.id

    @staticmethod
    def _get_or_404(participacion_id: int):
        participacion = db.session.get(
            ParticipacionRelevante,
            ParticipacionRelevanteService._validar_id(
                participacion_id, "participacion_id"
            )
        )
        if not participacion:
            raise ValueError("Participacion relevante no encontrada")
        return participacion

    @staticmethod
    def _get_activa_or_404(participacion_id: int):
        participacion = ParticipacionRelevanteService._get_or_404(participacion_id)
        if participacion.deleted_at is not None:
            raise ValueError("Participacion relevante no encontrada")
        return participacion

    @staticmethod
    def _validar_no_duplicado(
        investigador_id: int,
        nombre_evento: str,
        forma_participacion: str,
        fecha,
        participacion_id: int = None
    ):
        query = ParticipacionRelevante.query.filter(
            ParticipacionRelevante.deleted_at.is_(None),
            ParticipacionRelevante.investigador_id == investigador_id,
            ParticipacionRelevante.nombre_evento == nombre_evento,
            ParticipacionRelevante.forma_participacion == forma_participacion,
            ParticipacionRelevante.fecha == fecha,
        )

        if participacion_id is not None:
            query = query.filter(ParticipacionRelevante.id != participacion_id)

        if query.first():
            raise ValueError(
                "El investigador ya tiene una participacion relevante identica en esa fecha"
            )

    @staticmethod
    def get_all(filters: dict = None):
        filters = filters or {}
        query = ParticipacionRelevante.query

        investigador_id = ParticipacionRelevanteService._parse_int_filter(
            filters.get("investigador_id"), "investigador_id"
        )
        if investigador_id is not None:
            query = query.filter(
                ParticipacionRelevante.investigador_id == investigador_id
            )

        activos = ParticipacionRelevanteService._normalizar_activos(
            filters.get("activos")
        )
        if activos == "true":
            query = query.filter(ParticipacionRelevante.deleted_at.is_(None))
        elif activos == "false":
            query = query.filter(ParticipacionRelevante.deleted_at.isnot(None))
        elif activos != "all":
            query = query.filter(ParticipacionRelevante.deleted_at.is_(None))

        orden = ParticipacionRelevanteService._normalizar_orden(
            filters.get("orden")
        )
        if orden == "asc":
            query = query.order_by(ParticipacionRelevante.fecha.asc())
        else:
            query = query.order_by(ParticipacionRelevante.fecha.desc())

        return [p.serialize() for p in query.all()]

    @staticmethod
    def get_by_id(participacion_id: int):
        return ParticipacionRelevanteService._get_or_404(
            participacion_id
        ).serialize()

    @staticmethod
    def create(data: dict, user_id: int):
        ParticipacionRelevanteService._validar_payload(data)
        ParticipacionRelevanteService._validar_user_id(user_id)

        nombre_evento = normalizar_texto(
            ParticipacionRelevanteService._validar_texto(
                data.get("nombre_evento"), "nombre_evento"
            )
        )
        forma_participacion = normalizar_texto(
            ParticipacionRelevanteService._validar_texto(
                data.get("forma_participacion"), "forma_participacion"
            )
        )
        fecha = ParticipacionRelevanteService._validar_fecha(data.get("fecha"))
        investigador_id = ParticipacionRelevanteService._validar_investigador(
            data.get("investigador_id")
        )

        ParticipacionRelevanteService._validar_no_duplicado(
            investigador_id,
            nombre_evento,
            forma_participacion,
            fecha,
        )

        participacion = ParticipacionRelevante(
            nombre_evento=nombre_evento,
            forma_participacion=forma_participacion,
            fecha=fecha,
            investigador_id=investigador_id,
            created_by=user_id
        )

        db.session.add(participacion)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return participacion.serialize()

    @staticmethod
    def update(participacion_id: int, data: dict):
        ParticipacionRelevanteService._validar_payload(data)
        part = ParticipacionRelevanteService._get_activa_or_404(participacion_id)

        nombre_evento = part.nombre_evento
        if "nombre_evento" in data:
            nombre_evento = normalizar_texto(
                ParticipacionRelevanteService._validar_texto(
                    data["nombre_evento"], "nombre_evento"
                )
            )

        forma_participacion = part.forma_participacion
        if "forma_participacion" in data:
            forma_participacion = normalizar_texto(
                ParticipacionRelevanteService._validar_texto(
                    data["forma_participacion"], "forma_participacion"
                )
            )

        fecha = part.fecha
        if "fecha" in data:
            fecha = ParticipacionRelevanteService._validar_fecha(data["fecha"])

        investigador_id = part.investigador_id
        if "investigador_id" in data:
            investigador_id = ParticipacionRelevanteService._validar_investigador(
                data.get("investigador_id")
            )

        ParticipacionRelevanteService._validar_no_duplicado(
            investigador_id,
            nombre_evento,
            forma_participacion,
            fecha,
            part.id,
        )

        if "nombre_evento" in data:
            part.nombre_evento = nombre_evento

        if "forma_participacion" in data:
            part.forma_participacion = forma_participacion

        if "fecha" in data:
            part.fecha = fecha

        if "investigador_id" in data:
            part.investigador_id = investigador_id

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return part.serialize()

    @staticmethod
    def delete(participacion_id: int, user_id: int):
        ParticipacionRelevanteService._validar_user_id(user_id)

        part = ParticipacionRelevanteService._get_activa_or_404(participacion_id)
        part.soft_delete(user_id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Participacion relevante eliminada correctamente"}
