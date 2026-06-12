from datetime import datetime

from modules.grupo.models.grupo import GrupoInvestigacionUtn
from modules.produccion.models.documentacion_autores import (
    DocumentacionBibliografica,
    Autor,
    DocumentacionBibliograficaMemoriaVersion,
    DocumentacionBibliograficaAutorMemoriaVersion,
)
from modules.shared.services.auditoria_service import AuditoriaService
from modules.memorias.services.memoria_periodo_service import esta_en_periodo_memoria
from extension import db


class DocumentacionBibliograficaService:

    # =========================
    # Helpers
    # =========================

    @staticmethod
    def _get_activo_or_404(doc_id: int):
        doc = db.session.get(DocumentacionBibliografica, doc_id)
        if not doc or doc.deleted_at is not None:
            raise Exception("Documentacion bibliografica no encontrada")
        return doc

    @staticmethod
    def _normalizar_texto(valor: str, campo: str):
        if not isinstance(valor, str) or not valor.strip():
            raise Exception(f"{campo} es obligatorio")

        return " ".join(valor.strip().split()).lower()

    @staticmethod
    def _parse_fecha(valor, campo="fecha"):
        try:
            return datetime.strptime(valor, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            raise Exception(
                f"El campo '{campo}' es obligatorio y debe tener formato YYYY-MM-DD"
            )

    # =========================
    # GET ALL
    # =========================
    @staticmethod
    def get_all(filters: dict = None):
        query = DocumentacionBibliografica.query

        if not filters:
            filters = {"activos": "true"}

        activos = filters.get("activos", "true")
        if activos is None:
            activos = "true"

        activos = activos.strip().lower()

        if activos == "true":
            query = query.filter(DocumentacionBibliografica.deleted_at.is_(None))
        elif activos == "false":
            query = query.filter(DocumentacionBibliografica.deleted_at.isnot(None))
        elif activos == "all":
            pass
        else:
            query = query.filter(DocumentacionBibliografica.deleted_at.is_(None))

        if filters:
            orden = filters.get("orden")
            if orden == "asc":
                query = query.order_by(DocumentacionBibliografica.titulo.asc())
            elif orden == "desc":
                query = query.order_by(DocumentacionBibliografica.titulo.desc())

        return [d.serialize() for d in query.all()]

    # =========================
    # GET BY ID
    # =========================
    @staticmethod
    def get_by_id(doc_id: int):
        doc = db.session.get(DocumentacionBibliografica, doc_id)
        if not doc:
            raise Exception("Documentacion bibliografica no encontrada")
        return doc.serialize()

    @staticmethod
    def get_historial(doc_id: int):
        doc = db.session.get(DocumentacionBibliografica, doc_id)
        if not doc:
            raise Exception("Documentacion bibliografica no encontrada")
        return AuditoriaService.obtener_historial_entidad(
            entidad="documentacion_bibliografica",
            registro_id=doc.id
        )

    # =========================
    # CREATE
    # =========================
    @staticmethod
    def create(data: dict, user_id: int):
        grupo = db.session.get(GrupoInvestigacionUtn, data["grupo_id"])
        if not grupo or grupo.deleted_at is not None:
            raise Exception("Grupo no encontrado")
        if not data.get("titulo") or not data.get("editorial"):
            raise Exception("Titulo y editorial son obligatorios")

        if not isinstance(data.get("anio"), int):
            raise Exception("El anio debe ser numerico")

        doc = DocumentacionBibliografica(
            titulo=DocumentacionBibliograficaService._normalizar_texto(
                data["titulo"], "Titulo"
            ),
            editorial=DocumentacionBibliograficaService._normalizar_texto(
                data["editorial"], "Editorial"
            ),
            anio=data["anio"],
            fecha=DocumentacionBibliograficaService._parse_fecha(data.get("fecha")),
            grupo_id=data["grupo_id"],
            created_by=user_id
        )

        db.session.add(doc)
        db.session.commit()

        return doc.serialize()

    # =========================
    # UPDATE
    # =========================
    @staticmethod
    def update(doc_id: int, data: dict, user_id: int):
        doc = DocumentacionBibliograficaService._get_activo_or_404(doc_id)
        cambios = {}

        if "titulo" in data:
            nuevo_valor = DocumentacionBibliograficaService._normalizar_texto(
                data["titulo"], "Titulo"
            )
            cambio = AuditoriaService.construir_cambio(doc.titulo, nuevo_valor)
            if cambio:
                cambios["titulo"] = cambio
                doc.titulo = nuevo_valor

        if "editorial" in data:
            nuevo_valor = DocumentacionBibliograficaService._normalizar_texto(
                data["editorial"], "Editorial"
            )
            cambio = AuditoriaService.construir_cambio(doc.editorial, nuevo_valor)
            if cambio:
                cambios["editorial"] = cambio
                doc.editorial = nuevo_valor

        if "anio" in data:
            cambio = AuditoriaService.construir_cambio(doc.anio, data["anio"])
            if cambio:
                cambios["anio"] = cambio
                doc.anio = data["anio"]

        if "fecha" in data:
            nuevo_valor = DocumentacionBibliograficaService._parse_fecha(
                data["fecha"]
            )
            cambio = AuditoriaService.construir_cambio(doc.fecha, nuevo_valor)
            if cambio:
                cambios["fecha"] = cambio
                doc.fecha = nuevo_valor

        if "grupo_id" in data:
            cambio = AuditoriaService.construir_cambio(doc.grupo_id, data["grupo_id"])
            if cambio:
                cambios["grupo_id"] = cambio
                doc.grupo_id = data["grupo_id"]

        if cambios:
            doc.mark_updated(user_id)
            AuditoriaService.registrar_cambios(
                entidad="documentacion_bibliografica",
                registro_id=doc.id,
                cambios=cambios,
                user_id=user_id
            )

        db.session.commit()

        return doc.serialize()

    # =========================
    # SOFT DELETE
    # =========================
    @staticmethod
    def delete(doc_id: int, user_id: int):
        doc = DocumentacionBibliograficaService._get_activo_or_404(doc_id)

        doc.soft_delete(user_id)

        db.session.commit()

        return {"message": "Documentacion bibliografica eliminada correctamente"}

    # =========================
    # RELACION DOCUMENTO - AUTOR
    # =========================
    @staticmethod
    def add_autor(doc_id: int, autor_id: int):
        doc = DocumentacionBibliograficaService._get_activo_or_404(doc_id)

        autor = db.session.get(Autor, autor_id)
        if not autor or getattr(autor, "deleted_at", None) is not None:
            raise ValueError("Autor no encontrado")

        if autor in doc.autores:
            raise ValueError("El autor ya esta asociado")

        doc.autores.append(autor)
        db.session.commit()

        return doc.serialize()

    @staticmethod
    def remove_autor(doc_id: int, autor_id: int):
        doc = DocumentacionBibliograficaService._get_activo_or_404(doc_id)

        autor = db.session.get(Autor, autor_id)
        if not autor:
            raise Exception("Autor no encontrado")

        if autor not in doc.autores:
            raise Exception("La relacion no existe")

        doc.autores.remove(autor)
        db.session.commit()

        return doc.serialize()

    @staticmethod
    def snapshot_para_memoria_version(memoria_version, user_id):
        documentos = DocumentacionBibliografica.query.filter().all()

        snapshots = []
        for doc in documentos:
            if not esta_en_periodo_memoria(memoria_version, doc.fecha):
                continue
            snapshot = DocumentacionBibliograficaMemoriaVersion(
                memoria_version_id=memoria_version.id,
                documentacion_bibliografica_id=doc.id,
                titulo=doc.titulo,
                editorial=doc.editorial,
                anio=doc.anio,
                fecha=doc.fecha,
                grupo_id=doc.grupo_id,
                grupo_nombre=(
                    doc.grupo_utn.nombre_unidad_academica
                    if doc.grupo_utn else None
                ),
                created_by=user_id
            )
            db.session.add(snapshot)
            db.session.flush()

            for autor in getattr(doc, "autores", []):
                if getattr(autor, "deleted_at", None) is not None:
                    continue

                autor_snapshot = DocumentacionBibliograficaAutorMemoriaVersion(
                    documentacion_memoria_version=snapshot,
                    autor_id=autor.id,
                    nombre_apellido=autor.nombre_apellido,
                    created_by=user_id
                )
                db.session.add(autor_snapshot)

            snapshots.append(snapshot)

        return snapshots

    @staticmethod
    def obtener_snapshots_por_memoria_version(memoria_version_id: int):
        snapshots = (
            DocumentacionBibliograficaMemoriaVersion.query
            .filter(
                DocumentacionBibliograficaMemoriaVersion.memoria_version_id == memoria_version_id,
                DocumentacionBibliograficaMemoriaVersion.deleted_at.is_(None)
            )
            .order_by(DocumentacionBibliograficaMemoriaVersion.titulo.asc())
            .all()
        )

        return [snapshot.serialize() for snapshot in snapshots]
