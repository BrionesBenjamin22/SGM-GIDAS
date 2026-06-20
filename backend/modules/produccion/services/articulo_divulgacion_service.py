from datetime import datetime, date

from extension import db
from modules.produccion.models.articulo_divulgacion import (
    ArticuloDivulgacion,
    ArticuloDivulgacionMemoriaVersion,
)
from modules.grupo.models.grupo import GrupoInvestigacionUtn
from modules.shared.services.auditoria_service import AuditoriaService
from modules.memorias.services.memoria_periodo_service import esta_en_periodo_memoria


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
    def get_historial(articulo_id: int):
        articulo = db.session.get(ArticuloDivulgacion, articulo_id)
        if not articulo:
            raise ValueError("Articulo de divulgacion no encontrado")

        return AuditoriaService.obtener_historial_entidad(
            entidad="articulo_divulgacion",
            registro_id=articulo.id
        )

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
        cambios = {}

        if "fecha_publicacion" in data:
            try:
                nuevo_valor = datetime.strptime(
                    data["fecha_publicacion"], "%Y-%m-%d"
                ).date()
            except ValueError:
                raise ValueError("La fecha debe tener formato YYYY-MM-DD")

            ArticuloDivulgacionService._validar_fecha(nuevo_valor)
            cambio = AuditoriaService.construir_cambio(
                articulo.fecha_publicacion,
                nuevo_valor
            )
            if cambio:
                cambios["fecha_publicacion"] = cambio
                articulo.fecha_publicacion = nuevo_valor

        if "titulo" in data:
            nuevo_valor = ArticuloDivulgacionService._validar_texto(
                data["titulo"], "titulo", min_len=5
            )
            cambio = AuditoriaService.construir_cambio(
                articulo.titulo,
                nuevo_valor
            )
            if cambio:
                cambios["titulo"] = cambio
                articulo.titulo = nuevo_valor

        if "descripcion" in data:
            nuevo_valor = ArticuloDivulgacionService._validar_texto(
                data["descripcion"], "descripcion", min_len=10
            )
            cambio = AuditoriaService.construir_cambio(
                articulo.descripcion,
                nuevo_valor
            )
            if cambio:
                cambios["descripcion"] = cambio
                articulo.descripcion = nuevo_valor

        if "grupo_utn_id" in data:
            nuevo_valor = ArticuloDivulgacionService._validar_grupo(
                data["grupo_utn_id"]
            )
            cambio = AuditoriaService.construir_cambio(
                articulo.grupo_utn_id,
                nuevo_valor
            )
            if cambio:
                cambios["grupo_utn_id"] = cambio
                articulo.grupo_utn_id = nuevo_valor

        if cambios and user_id is not None:
            articulo.mark_updated(user_id)
            AuditoriaService.registrar_cambios(
                entidad="articulo_divulgacion",
                registro_id=articulo.id,
                cambios=cambios,
                user_id=user_id
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

    @staticmethod
    def snapshot_para_memoria_version(memoria_version, user_id):
        articulos = ArticuloDivulgacion.query.filter().all()

        snapshots = []
        for articulo in articulos:
            if not esta_en_periodo_memoria(
                memoria_version,
                articulo.fecha_publicacion
            ):
                continue
            snapshot = ArticuloDivulgacionMemoriaVersion(
                memoria_version_id=memoria_version.id,
                articulo_divulgacion_id=articulo.id,
                titulo=articulo.titulo,
                descripcion=articulo.descripcion,
                fecha_publicacion=articulo.fecha_publicacion,
                grupo_utn_id=articulo.grupo_utn_id,
                grupo_utn_nombre=(
                    articulo.grupo_utn.nombre_sigla_grupo
                    if articulo.grupo_utn else None
                ),
                created_by=user_id
            )
            db.session.add(snapshot)
            snapshots.append(snapshot)

        return snapshots

    @staticmethod
    def obtener_snapshots_por_memoria_version(memoria_version_id: int):
        snapshots = (
            ArticuloDivulgacionMemoriaVersion.query
            .filter(
                ArticuloDivulgacionMemoriaVersion.memoria_version_id == memoria_version_id,
                ArticuloDivulgacionMemoriaVersion.deleted_at.is_(None)
            )
            .order_by(
                ArticuloDivulgacionMemoriaVersion.fecha_publicacion.desc(),
                ArticuloDivulgacionMemoriaVersion.id.desc()
            )
            .all()
        )

        return [snapshot.serialize() for snapshot in snapshots]
