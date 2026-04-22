from datetime import datetime, date

from extension import db
from core.models.articulo_divulgacion import ArticuloDivulgacion
from core.models.grupo import GrupoInvestigacionUtn


class ArticuloDivulgacionService:
    @staticmethod
    def _validar_payload(data):
        if not isinstance(data, dict) or not data:
            raise ValueError("Los datos enviados son invalidos")

    @staticmethod
    def _validar_user_id(user_id):
        if not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("El user_id es invalido")
        return user_id

    @staticmethod
    def _normalizar_activos(activos):
        if activos is None:
            return "true"
        return str(activos).strip().lower()

    @staticmethod
    def _validar_texto(valor, campo, min_len=3, max_len=500):
        if valor is None:
            raise ValueError(f"El campo '{campo}' es obligatorio")

        if not isinstance(valor, str):
            raise ValueError(f"El campo '{campo}' debe ser texto")

        valor = valor.strip()

        if not valor:
            raise ValueError(f"El campo '{campo}' no puede estar vacio")

        if len(valor) < min_len:
            raise ValueError(
                f"El campo '{campo}' debe tener al menos {min_len} caracteres"
            )

        if len(valor) > max_len:
            raise ValueError(
                f"El campo '{campo}' no puede superar los {max_len} caracteres"
            )

        return valor

    @staticmethod
    def _validar_fecha(fecha_publicacion):
        if fecha_publicacion > date.today():
            raise ValueError("La fecha de publicacion no puede ser futura")

    @staticmethod
    def _validar_grupo(grupo_utn_id):
        if not isinstance(grupo_utn_id, int) or grupo_utn_id <= 0:
            raise ValueError("Grupo UTN invalido")

        grupo = db.session.get(GrupoInvestigacionUtn, grupo_utn_id)
        if not grupo or grupo.deleted_at is not None:
            raise ValueError("Grupo UTN invalido")

        return grupo_utn_id

    @staticmethod
    def _get_articulo_activo_or_404(articulo_id: int):
        articulo = ArticuloDivulgacion.query.filter(
            ArticuloDivulgacion.id == articulo_id,
            ArticuloDivulgacion.deleted_at.is_(None)
        ).first()

        if not articulo:
            raise ValueError("Articulo de divulgacion no encontrado")

        return articulo

    @staticmethod
    def get_all(filters: dict = None):
        query = ArticuloDivulgacion.query
        filters = filters or {"activos": "true"}

        activos = ArticuloDivulgacionService._normalizar_activos(
            filters.get("activos")
        )
        if activos == "true":
            query = query.filter(ArticuloDivulgacion.deleted_at.is_(None))
        elif activos == "false":
            query = query.filter(ArticuloDivulgacion.deleted_at.isnot(None))
        elif activos != "all":
            query = query.filter(ArticuloDivulgacion.deleted_at.is_(None))

        grupo_id = filters.get("grupo_utn_id")
        if grupo_id:
            query = query.filter(ArticuloDivulgacion.grupo_utn_id == grupo_id)

        orden = filters.get("orden")
        if orden == "asc":
            query = query.order_by(ArticuloDivulgacion.fecha_publicacion.asc())
        else:
            query = query.order_by(ArticuloDivulgacion.fecha_publicacion.desc())

        return [a.serialize() for a in query.all()]

    @staticmethod
    def get_by_id(articulo_id: int):
        articulo = db.session.get(ArticuloDivulgacion, articulo_id)
        if not articulo:
            raise ValueError("Articulo de divulgacion no encontrado")

        return articulo.serialize()

    @staticmethod
    def create(data: dict, user_id: int):
        ArticuloDivulgacionService._validar_payload(data)
        ArticuloDivulgacionService._validar_user_id(user_id)

        try:
            fecha_publicacion = datetime.strptime(
                data["fecha_publicacion"], "%Y-%m-%d"
            ).date()
        except (KeyError, ValueError):
            raise ValueError(
                "La fecha de publicacion es obligatoria y debe tener formato YYYY-MM-DD"
            )

        ArticuloDivulgacionService._validar_fecha(fecha_publicacion)

        titulo = ArticuloDivulgacionService._validar_texto(
            data.get("titulo"), "titulo", min_len=5
        )
        descripcion = ArticuloDivulgacionService._validar_texto(
            data.get("descripcion"), "descripcion", min_len=10
        )
        grupo_utn_id = ArticuloDivulgacionService._validar_grupo(
            data.get("grupo_utn_id")
        )

        articulo = ArticuloDivulgacion(
            titulo=titulo,
            descripcion=descripcion,
            fecha_publicacion=fecha_publicacion,
            grupo_utn_id=grupo_utn_id,
            created_by=user_id
        )

        db.session.add(articulo)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return articulo.serialize()

    @staticmethod
    def update(articulo_id: int, data: dict, user_id: int = None):
        ArticuloDivulgacionService._validar_payload(data)

        if user_id is not None:
            ArticuloDivulgacionService._validar_user_id(user_id)

        articulo = ArticuloDivulgacionService._get_articulo_activo_or_404(
            articulo_id
        )

        if "fecha_publicacion" in data:
            try:
                fecha_publicacion = datetime.strptime(
                    data["fecha_publicacion"], "%Y-%m-%d"
                ).date()
            except ValueError:
                raise ValueError("La fecha debe tener formato YYYY-MM-DD")

            ArticuloDivulgacionService._validar_fecha(fecha_publicacion)
            articulo.fecha_publicacion = fecha_publicacion

        if "titulo" in data:
            articulo.titulo = ArticuloDivulgacionService._validar_texto(
                data["titulo"], "titulo", min_len=5
            )

        if "descripcion" in data:
            articulo.descripcion = ArticuloDivulgacionService._validar_texto(
                data["descripcion"], "descripcion", min_len=10
            )

        if "grupo_utn_id" in data:
            articulo.grupo_utn_id = ArticuloDivulgacionService._validar_grupo(
                data["grupo_utn_id"]
            )

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return articulo.serialize()

    @staticmethod
    def delete(articulo_id: int, user_id: int):
        ArticuloDivulgacionService._validar_user_id(user_id)
        articulo = ArticuloDivulgacionService._get_articulo_activo_or_404(
            articulo_id
        )

        articulo.soft_delete(user_id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Articulo de divulgacion eliminado correctamente"}
