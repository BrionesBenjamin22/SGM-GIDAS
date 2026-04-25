from datetime import date, datetime

from sqlalchemy import or_

from core.models.grupo import GrupoInvestigacionUtn
from core.models.personal import Investigador
from core.models.trabajo_reunion import TipoReunion
from core.models.trabajo_revista import (
    TrabajosRevistasReferato,
    TrabajosRevistasReferatoMemoriaVersion,
)
from core.services.auditoria_service import AuditoriaService
from extension import db


class TrabajosRevistasReferatoService:

    @staticmethod
    def _validar_payload(data: dict):
        if not isinstance(data, dict) or not data:
            raise ValueError("Los datos no pueden estar vacios")

    @staticmethod
    def _validar_id(valor, campo: str, permitir_none: bool = False):
        if valor is None and permitir_none:
            return None

        if not isinstance(valor, int) or valor <= 0:
            raise ValueError(f"El campo '{campo}' debe ser un entero positivo")

        return valor

    @staticmethod
    def _validar_user_id(user_id: int):
        return TrabajosRevistasReferatoService._validar_id(user_id, "user_id")

    @staticmethod
    def _validar_texto(valor: str, campo: str, max_len: int = 255):
        if not isinstance(valor, str) or not valor.strip():
            raise ValueError(f"El campo '{campo}' es obligatorio")

        valor = " ".join(valor.strip().split())

        if len(valor) > max_len:
            raise ValueError(
                f"El campo '{campo}' no puede superar los {max_len} caracteres"
            )

        return valor

    @staticmethod
    def _validar_fecha(fecha_str: str):
        try:
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            raise ValueError("La fecha debe tener formato YYYY-MM-DD")

        if fecha > date.today():
            raise ValueError("La fecha no puede ser futura")

        return fecha

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
    def _normalizar_texto_filtro(valor):
        if valor is None:
            return None
        valor = " ".join(str(valor).strip().split())
        return valor or None

    @staticmethod
    def _parse_int_filter(valor, campo: str):
        if valor is None or valor == "":
            return None

        try:
            valor = int(valor)
        except (TypeError, ValueError):
            raise ValueError(f"El campo '{campo}' debe ser un entero positivo")

        return TrabajosRevistasReferatoService._validar_id(valor, campo)

    @staticmethod
    def _validar_grupo(grupo_utn_id):
        grupo_utn_id = TrabajosRevistasReferatoService._validar_id(
            grupo_utn_id, "grupo_utn_id", permitir_none=True
        )

        if grupo_utn_id is None:
            return None

        grupo = db.session.get(GrupoInvestigacionUtn, grupo_utn_id)
        if not grupo or getattr(grupo, "deleted_at", None) is not None:
            raise ValueError("Grupo UTN invalido")

        return grupo.id

    @staticmethod
    def _validar_tipo_reunion(tipo_reunion_id):
        tipo_reunion_id = TrabajosRevistasReferatoService._validar_id(
            tipo_reunion_id, "tipo_reunion_id"
        )
        tipo_reunion = db.session.get(TipoReunion, tipo_reunion_id)
        if not tipo_reunion:
            raise ValueError("Tipo de reunion invalido")
        return tipo_reunion.id

    @staticmethod
    def _get_or_404(trabajo_id: int):
        trabajo = db.session.get(
            TrabajosRevistasReferato,
            TrabajosRevistasReferatoService._validar_id(
                trabajo_id, "trabajo_id"
            )
        )

        if not trabajo:
            raise ValueError("Trabajo en revista no encontrado")

        return trabajo

    @staticmethod
    def _get_activo_or_404(trabajo_id: int):
        trabajo = TrabajosRevistasReferatoService._get_or_404(trabajo_id)

        if trabajo.deleted_at is not None:
            raise ValueError("No se puede operar sobre un trabajo eliminado")

        return trabajo

    @staticmethod
    def _validar_no_duplicado(
        titulo_trabajo: str,
        nombre_revista: str,
        editorial: str,
        issn: str,
        pais: str,
        fecha,
        trabajo_id: int = None
    ):
        query = TrabajosRevistasReferato.query.filter(
            TrabajosRevistasReferato.deleted_at.is_(None),
            TrabajosRevistasReferato.titulo_trabajo == titulo_trabajo,
            TrabajosRevistasReferato.nombre_revista == nombre_revista,
            TrabajosRevistasReferato.editorial == editorial,
            TrabajosRevistasReferato.issn == issn,
            TrabajosRevistasReferato.pais == pais,
            TrabajosRevistasReferato.fecha == fecha,
        )

        if trabajo_id is not None:
            query = query.filter(TrabajosRevistasReferato.id != trabajo_id)

        if query.first():
            raise ValueError("Ya existe un trabajo en revista con los mismos datos")

    @staticmethod
    def _validar_investigadores_ids(investigadores_ids):
        if not isinstance(investigadores_ids, list) or not investigadores_ids:
            raise ValueError("investigadores_ids debe ser una lista no vacia")

        ids = []
        vistos = set()
        for investigador_id in investigadores_ids:
            investigador_id = TrabajosRevistasReferatoService._validar_id(
                investigador_id, "investigadores_ids"
            )
            if investigador_id in vistos:
                raise ValueError(
                    "investigadores_ids no puede contener IDs repetidos"
                )
            vistos.add(investigador_id)
            ids.append(investigador_id)

        return ids

    @staticmethod
    def get_all(filters: dict = None):
        filters = filters or {}
        query = TrabajosRevistasReferato.query

        activos = TrabajosRevistasReferatoService._normalizar_activos(
            filters.get("activos")
        )
        if activos == "true":
            query = query.filter(
                TrabajosRevistasReferato.deleted_at.is_(None),
                TrabajosRevistasReferato.activo.is_(True)
            )
        elif activos == "false":
            query = query.filter(
                or_(
                    TrabajosRevistasReferato.deleted_at.isnot(None),
                    TrabajosRevistasReferato.activo.is_(False)
                )
            )
        elif activos != "all":
            query = query.filter(
                TrabajosRevistasReferato.deleted_at.is_(None),
                TrabajosRevistasReferato.activo.is_(True)
            )

        grupo_utn_id = TrabajosRevistasReferatoService._parse_int_filter(
            filters.get("grupo_utn_id"), "grupo_utn_id"
        )
        if grupo_utn_id is not None:
            query = query.filter(
                TrabajosRevistasReferato.grupo_utn_id == grupo_utn_id
            )

        pais = TrabajosRevistasReferatoService._normalizar_texto_filtro(
            filters.get("pais")
        )
        if pais:
            query = query.filter(TrabajosRevistasReferato.pais.ilike(f"%{pais}%"))

        editorial = TrabajosRevistasReferatoService._normalizar_texto_filtro(
            filters.get("editorial")
        )
        if editorial:
            query = query.filter(
                TrabajosRevistasReferato.editorial.ilike(f"%{editorial}%")
            )

        orden = TrabajosRevistasReferatoService._normalizar_orden(
            filters.get("orden")
        )
        if orden == "asc":
            query = query.order_by(TrabajosRevistasReferato.fecha.asc())
        else:
            query = query.order_by(TrabajosRevistasReferato.fecha.desc())

        return [t.serialize() for t in query.all()]

    @staticmethod
    def get_by_id(trabajo_id: int):
        return TrabajosRevistasReferatoService._get_or_404(trabajo_id).serialize()

    @staticmethod
    def get_historial(trabajo_id: int):
        trabajo = TrabajosRevistasReferatoService._get_or_404(trabajo_id)
        return AuditoriaService.obtener_historial_entidad(
            entidad="trabajo_revista_referato",
            registro_id=trabajo.id
        )

    @staticmethod
    def create(data: dict, user_id: int):
        TrabajosRevistasReferatoService._validar_payload(data)
        TrabajosRevistasReferatoService._validar_user_id(user_id)

        titulo_trabajo = TrabajosRevistasReferatoService._validar_texto(
            data.get("titulo_trabajo"), "titulo_trabajo"
        )
        nombre_revista = TrabajosRevistasReferatoService._validar_texto(
            data.get("nombre_revista"), "nombre_revista"
        )
        editorial = TrabajosRevistasReferatoService._validar_texto(
            data.get("editorial"), "editorial"
        )
        issn = TrabajosRevistasReferatoService._validar_texto(
            data.get("issn"), "issn", max_len=50
        )
        pais = TrabajosRevistasReferatoService._validar_texto(
            data.get("pais"), "pais", max_len=120
        )
        fecha = TrabajosRevistasReferatoService._validar_fecha(data.get("fecha"))
        grupo_utn_id = TrabajosRevistasReferatoService._validar_grupo(
            data.get("grupo_utn_id")
        )
        tipo_reunion_id = TrabajosRevistasReferatoService._validar_tipo_reunion(
            data.get("tipo_reunion_id")
        )

        TrabajosRevistasReferatoService._validar_no_duplicado(
            titulo_trabajo,
            nombre_revista,
            editorial,
            issn,
            pais,
            fecha,
        )

        trabajo = TrabajosRevistasReferato(
            titulo_trabajo=titulo_trabajo,
            nombre_revista=nombre_revista,
            editorial=editorial,
            issn=issn,
            fecha=fecha,
            pais=pais,
            grupo_utn_id=grupo_utn_id,
            tipo_reunion_id=tipo_reunion_id,
            created_by=user_id
        )

        db.session.add(trabajo)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return trabajo.serialize()

    @staticmethod
    def update(trabajo_id: int, data: dict, user_id: int):
        TrabajosRevistasReferatoService._validar_payload(data)
        TrabajosRevistasReferatoService._validar_user_id(user_id)
        trabajo = TrabajosRevistasReferatoService._get_activo_or_404(trabajo_id)
        cambios = {}

        titulo_trabajo = trabajo.titulo_trabajo
        if "titulo_trabajo" in data:
            titulo_trabajo = TrabajosRevistasReferatoService._validar_texto(
                data["titulo_trabajo"], "titulo_trabajo"
            )

        nombre_revista = trabajo.nombre_revista
        if "nombre_revista" in data:
            nombre_revista = TrabajosRevistasReferatoService._validar_texto(
                data["nombre_revista"], "nombre_revista"
            )

        editorial = trabajo.editorial
        if "editorial" in data:
            editorial = TrabajosRevistasReferatoService._validar_texto(
                data["editorial"], "editorial"
            )

        issn = trabajo.issn
        if "issn" in data:
            issn = TrabajosRevistasReferatoService._validar_texto(
                data["issn"], "issn", max_len=50
            )

        pais = trabajo.pais
        if "pais" in data:
            pais = TrabajosRevistasReferatoService._validar_texto(
                data["pais"], "pais", max_len=120
            )

        fecha = trabajo.fecha
        if "fecha" in data:
            fecha = TrabajosRevistasReferatoService._validar_fecha(data["fecha"])

        grupo_utn_id = trabajo.grupo_utn_id
        if "grupo_utn_id" in data:
            grupo_utn_id = TrabajosRevistasReferatoService._validar_grupo(
                data["grupo_utn_id"]
            )

        tipo_reunion_id = trabajo.tipo_reunion_id
        if "tipo_reunion_id" in data:
            tipo_reunion_id = TrabajosRevistasReferatoService._validar_tipo_reunion(
                data["tipo_reunion_id"]
            )

        TrabajosRevistasReferatoService._validar_no_duplicado(
            titulo_trabajo,
            nombre_revista,
            editorial,
            issn,
            pais,
            fecha,
            trabajo.id,
        )

        cambio = AuditoriaService.construir_cambio(
            trabajo.titulo_trabajo,
            titulo_trabajo
        )
        if cambio:
            cambios["titulo_trabajo"] = cambio
            trabajo.titulo_trabajo = titulo_trabajo

        cambio = AuditoriaService.construir_cambio(
            trabajo.nombre_revista,
            nombre_revista
        )
        if cambio:
            cambios["nombre_revista"] = cambio
            trabajo.nombre_revista = nombre_revista

        cambio = AuditoriaService.construir_cambio(
            trabajo.editorial,
            editorial
        )
        if cambio:
            cambios["editorial"] = cambio
            trabajo.editorial = editorial

        cambio = AuditoriaService.construir_cambio(trabajo.issn, issn)
        if cambio:
            cambios["issn"] = cambio
            trabajo.issn = issn

        cambio = AuditoriaService.construir_cambio(trabajo.pais, pais)
        if cambio:
            cambios["pais"] = cambio
            trabajo.pais = pais

        cambio = AuditoriaService.construir_cambio(trabajo.fecha, fecha)
        if cambio:
            cambios["fecha"] = cambio
            trabajo.fecha = fecha

        cambio = AuditoriaService.construir_cambio(
            trabajo.grupo_utn_id,
            grupo_utn_id
        )
        if cambio:
            cambios["grupo_utn_id"] = cambio
            trabajo.grupo_utn_id = grupo_utn_id

        cambio = AuditoriaService.construir_cambio(
            trabajo.tipo_reunion_id,
            tipo_reunion_id
        )
        if cambio:
            cambios["tipo_reunion_id"] = cambio
            trabajo.tipo_reunion_id = tipo_reunion_id

        if cambios:
            trabajo.mark_updated(user_id)
            AuditoriaService.registrar_cambios(
                entidad="trabajo_revista_referato",
                registro_id=trabajo.id,
                cambios=cambios,
                user_id=user_id
            )

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return trabajo.serialize()

    @staticmethod
    def delete(trabajo_id: int, user_id: int):
        TrabajosRevistasReferatoService._validar_user_id(user_id)
        trabajo = TrabajosRevistasReferatoService._get_activo_or_404(trabajo_id)
        trabajo.soft_delete(user_id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Trabajo eliminado correctamente (soft delete)"}

    @staticmethod
    def restore(trabajo_id: int):
        trabajo = TrabajosRevistasReferatoService._get_or_404(trabajo_id)

        if trabajo.deleted_at is None and trabajo.activo is True:
            raise ValueError("El trabajo ya se encuentra activo")

        trabajo.restore()
        trabajo.activo = True

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return trabajo.serialize()

    @staticmethod
    def vincular_investigadores(
        trabajo_id: int,
        investigadores_ids: list[int],
        user_id: int | None = None
    ):
        trabajo = TrabajosRevistasReferatoService._get_activo_or_404(trabajo_id)
        investigadores_ids = (
            TrabajosRevistasReferatoService._validar_investigadores_ids(
                investigadores_ids
            )
        )

        investigadores = (
            db.session.query(Investigador)
            .filter(
                Investigador.id.in_(investigadores_ids),
                Investigador.deleted_at.is_(None)
            )
            .all()
        )

        if len(investigadores) != len(investigadores_ids):
            raise ValueError(
                "Uno o mas investigadores no existen o estan eliminados"
            )

        hubo_cambios = False
        for inv in investigadores:
            if inv not in trabajo.investigadores:
                trabajo.investigadores.append(inv)
                hubo_cambios = True
                AuditoriaService.registrar_evento_relacion(
                    entidad="trabajo_revista_referato",
                    registro_id=trabajo.id,
                    relacion="investigadores",
                    accion="vincular",
                    detalle={
                        "investigador_id": inv.id,
                        "nombre_apellido": inv.nombre_apellido
                    },
                    user_id=user_id
                )

        if hubo_cambios:
            trabajo.mark_updated(user_id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return trabajo.serialize()

    @staticmethod
    def desvincular_investigadores(
        trabajo_id: int,
        investigadores_ids: list[int],
        user_id: int | None = None
    ):
        trabajo = TrabajosRevistasReferatoService._get_activo_or_404(trabajo_id)
        investigadores_ids = (
            TrabajosRevistasReferatoService._validar_investigadores_ids(
                investigadores_ids
            )
        )

        hubo_cambios = False
        for inv in trabajo.investigadores[:]:
            if inv.id in investigadores_ids:
                trabajo.investigadores.remove(inv)
                hubo_cambios = True
                AuditoriaService.registrar_evento_relacion(
                    entidad="trabajo_revista_referato",
                    registro_id=trabajo.id,
                    relacion="investigadores",
                    accion="desvincular",
                    detalle={
                        "investigador_id": inv.id,
                        "nombre_apellido": inv.nombre_apellido
                    },
                    user_id=user_id
                )

        if hubo_cambios:
            trabajo.mark_updated(user_id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return trabajo.serialize()

    @staticmethod
    def snapshot_para_memoria_version(memoria_version, user_id):
        trabajos = TrabajosRevistasReferato.query.filter(
            TrabajosRevistasReferato.deleted_at.is_(None)
        ).all()

        snapshots = []
        for trabajo in trabajos:
            investigadores_participantes = ", ".join(sorted([
                investigador.nombre_apellido
                for investigador in trabajo.investigadores
                if getattr(investigador, "deleted_at", None) is None
            ]))

            snapshot = TrabajosRevistasReferatoMemoriaVersion(
                memoria_version_id=memoria_version.id,
                trabajo_revista_id=trabajo.id,
                titulo_trabajo=trabajo.titulo_trabajo,
                nombre_revista=trabajo.nombre_revista,
                editorial=trabajo.editorial,
                issn=trabajo.issn,
                pais=trabajo.pais,
                fecha=trabajo.fecha,
                grupo_utn_id=trabajo.grupo_utn_id,
                grupo_utn_nombre=(
                    trabajo.grupo_utn.nombre_sigla_grupo
                    if trabajo.grupo_utn else None
                ),
                tipo_reunion_id=trabajo.tipo_reunion_id,
                tipo_reunion_nombre=(
                    trabajo.tipo_reunion.nombre
                    if trabajo.tipo_reunion else None
                ),
                investigadores_participantes=investigadores_participantes,
                created_by=user_id
            )
            db.session.add(snapshot)
            snapshots.append(snapshot)

        return snapshots

    @staticmethod
    def obtener_snapshots_por_memoria_version(memoria_version_id: int):
        snapshots = (
            TrabajosRevistasReferatoMemoriaVersion.query
            .filter(
                TrabajosRevistasReferatoMemoriaVersion.memoria_version_id == memoria_version_id,
                TrabajosRevistasReferatoMemoriaVersion.deleted_at.is_(None)
            )
            .order_by(
                TrabajosRevistasReferatoMemoriaVersion.fecha.desc(),
                TrabajosRevistasReferatoMemoriaVersion.id.desc()
            )
            .all()
        )

        return [snapshot.serialize() for snapshot in snapshots]
