from datetime import date, datetime

from sqlalchemy import or_

from core.models.grupo import GrupoInvestigacionUtn
from core.models.personal import Investigador
from core.models.trabajo_reunion import (
    TrabajoReunionCientifica,
    TipoReunion,
    TrabajoReunionCientificaMemoriaVersion,
)
from core.services.auditoria_service import AuditoriaService
from core.services.memoria_periodo_service import esta_en_periodo_memoria
from extension import db


class TrabajoReunionCientificaService:

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
        return TrabajoReunionCientificaService._validar_id(user_id, "user_id")

    @staticmethod
    def _validar_texto(valor, campo, min_len=2, max_len=255):
        if valor is None:
            raise ValueError(f"El campo '{campo}' es obligatorio")

        if not isinstance(valor, str):
            raise ValueError(f"El campo '{campo}' debe ser texto")

        valor = " ".join(valor.strip().split())

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
    def _validar_fecha(fecha_str: str):
        try:
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            raise ValueError("La fecha debe tener formato YYYY-MM-DD")

        if fecha > date.today():
            raise ValueError("La fecha de inicio no puede ser futura")

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
    def _parse_int_filter(valor, campo: str):
        if valor is None or valor == "":
            return None

        try:
            valor = int(valor)
        except (TypeError, ValueError):
            raise ValueError(f"El campo '{campo}' debe ser un entero positivo")

        return TrabajoReunionCientificaService._validar_id(valor, campo)

    @staticmethod
    def _validar_grupo(grupo_utn_id):
        grupo_utn_id = TrabajoReunionCientificaService._validar_id(
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
        tipo_reunion_id = TrabajoReunionCientificaService._validar_id(
            tipo_reunion_id, "tipo_reunion_id"
        )
        tipo_reunion = db.session.get(TipoReunion, tipo_reunion_id)
        if not tipo_reunion:
            raise ValueError("Tipo de reunion cientifica invalido")
        return tipo_reunion.id

    @staticmethod
    def _get_or_404(trabajo_id: int):
        trabajo = db.session.get(
            TrabajoReunionCientifica,
            TrabajoReunionCientificaService._validar_id(trabajo_id, "trabajo_id")
        )
        if not trabajo:
            raise ValueError("Trabajo en reunion cientifica no encontrado")
        return trabajo

    @staticmethod
    def _get_activo_or_404(trabajo_id: int):
        trabajo = TrabajoReunionCientificaService._get_or_404(trabajo_id)
        if trabajo.deleted_at is not None:
            raise ValueError("No se puede operar sobre un trabajo eliminado")
        return trabajo

    @staticmethod
    def _validar_no_duplicado(
        titulo_trabajo: str,
        nombre_reunion: str,
        procedencia: str,
        fecha_inicio,
        trabajo_id: int = None
    ):
        query = TrabajoReunionCientifica.query.filter(
            TrabajoReunionCientifica.deleted_at.is_(None),
            TrabajoReunionCientifica.titulo_trabajo == titulo_trabajo,
            TrabajoReunionCientifica.nombre_reunion == nombre_reunion,
            TrabajoReunionCientifica.procedencia == procedencia,
            TrabajoReunionCientifica.fecha_inicio == fecha_inicio,
        )

        if trabajo_id is not None:
            query = query.filter(TrabajoReunionCientifica.id != trabajo_id)

        if query.first():
            raise ValueError(
                "Ya existe un trabajo en reunion cientifica con los mismos datos"
            )

    @staticmethod
    def _validar_investigadores_ids(investigadores_ids):
        if not isinstance(investigadores_ids, list) or not investigadores_ids:
            raise ValueError("investigadores_ids debe ser una lista no vacia")

        ids = []
        vistos = set()
        for investigador_id in investigadores_ids:
            investigador_id = TrabajoReunionCientificaService._validar_id(
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
        query = TrabajoReunionCientifica.query

        activos = TrabajoReunionCientificaService._normalizar_activos(
            filters.get("activos")
        )
        if activos == "true":
            query = query.filter(
                TrabajoReunionCientifica.deleted_at.is_(None),
                TrabajoReunionCientifica.activo.is_(True)
            )
        elif activos == "false":
            query = query.filter(
                or_(
                    TrabajoReunionCientifica.deleted_at.isnot(None),
                    TrabajoReunionCientifica.activo.is_(False)
                )
            )
        elif activos != "all":
            query = query.filter(
                TrabajoReunionCientifica.deleted_at.is_(None),
                TrabajoReunionCientifica.activo.is_(True)
            )

        investigador_id = TrabajoReunionCientificaService._parse_int_filter(
            filters.get("investigador_id"), "investigador_id"
        )
        if investigador_id is not None:
            query = query.join(TrabajoReunionCientifica.investigadores).filter(
                Investigador.id == investigador_id,
                Investigador.deleted_at.is_(None)
            )

        grupo_utn_id = TrabajoReunionCientificaService._parse_int_filter(
            filters.get("grupo_utn_id"), "grupo_utn_id"
        )
        if grupo_utn_id is not None:
            query = query.filter(TrabajoReunionCientifica.grupo_utn_id == grupo_utn_id)

        orden = TrabajoReunionCientificaService._normalizar_orden(
            filters.get("orden")
        )
        if orden == "asc":
            query = query.order_by(TrabajoReunionCientifica.fecha_inicio.asc())
        else:
            query = query.order_by(TrabajoReunionCientifica.fecha_inicio.desc())

        return [t.serialize() for t in query.all()]

    @staticmethod
    def get_by_id(trabajo_id: int):
        return TrabajoReunionCientificaService._get_or_404(trabajo_id).serialize()

    @staticmethod
    def get_historial(trabajo_id: int):
        trabajo = TrabajoReunionCientificaService._get_or_404(trabajo_id)
        return AuditoriaService.obtener_historial_entidad(
            entidad="trabajo_reunion_cientifica",
            registro_id=trabajo.id
        )

    @staticmethod
    def create(data: dict, user_id: int):
        TrabajoReunionCientificaService._validar_payload(data)
        TrabajoReunionCientificaService._validar_user_id(user_id)

        fecha_inicio = TrabajoReunionCientificaService._validar_fecha(
            data.get("fecha_inicio")
        )
        titulo = TrabajoReunionCientificaService._validar_texto(
            data.get("titulo_trabajo"), "titulo_trabajo", 5, 300
        )
        nombre_reunion = TrabajoReunionCientificaService._validar_texto(
            data.get("nombre_reunion"), "nombre_reunion", 3
        )
        procedencia = TrabajoReunionCientificaService._validar_texto(
            data.get("procedencia"), "procedencia", 2
        )
        tipo_reunion_id = TrabajoReunionCientificaService._validar_tipo_reunion(
            data.get("tipo_reunion_id")
        )
        grupo_utn_id = TrabajoReunionCientificaService._validar_grupo(
            data.get("grupo_utn_id")
        )

        TrabajoReunionCientificaService._validar_no_duplicado(
            titulo,
            nombre_reunion,
            procedencia,
            fecha_inicio,
        )

        trabajo = TrabajoReunionCientifica(
            titulo_trabajo=titulo,
            nombre_reunion=nombre_reunion,
            procedencia=procedencia,
            fecha_inicio=fecha_inicio,
            tipo_reunion_id=tipo_reunion_id,
            grupo_utn_id=grupo_utn_id,
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
        TrabajoReunionCientificaService._validar_payload(data)
        TrabajoReunionCientificaService._validar_user_id(user_id)
        trabajo = TrabajoReunionCientificaService._get_activo_or_404(trabajo_id)
        cambios = {}

        fecha_inicio = trabajo.fecha_inicio
        if "fecha_inicio" in data:
            fecha_inicio = TrabajoReunionCientificaService._validar_fecha(
                data["fecha_inicio"]
            )

        titulo = trabajo.titulo_trabajo
        if "titulo_trabajo" in data:
            titulo = TrabajoReunionCientificaService._validar_texto(
                data["titulo_trabajo"], "titulo_trabajo", 5, 300
            )

        nombre_reunion = trabajo.nombre_reunion
        if "nombre_reunion" in data:
            nombre_reunion = TrabajoReunionCientificaService._validar_texto(
                data["nombre_reunion"], "nombre_reunion", 3
            )

        procedencia = trabajo.procedencia
        if "procedencia" in data:
            procedencia = TrabajoReunionCientificaService._validar_texto(
                data["procedencia"], "procedencia", 2
            )

        tipo_reunion_id = trabajo.tipo_reunion_id
        if "tipo_reunion_id" in data:
            tipo_reunion_id = TrabajoReunionCientificaService._validar_tipo_reunion(
                data["tipo_reunion_id"]
            )

        grupo_utn_id = trabajo.grupo_utn_id
        if "grupo_utn_id" in data:
            grupo_utn_id = TrabajoReunionCientificaService._validar_grupo(
                data["grupo_utn_id"]
            )

        TrabajoReunionCientificaService._validar_no_duplicado(
            titulo,
            nombre_reunion,
            procedencia,
            fecha_inicio,
            trabajo.id,
        )

        cambio = AuditoriaService.construir_cambio(
            trabajo.fecha_inicio,
            fecha_inicio
        )
        if cambio:
            cambios["fecha_inicio"] = cambio
            trabajo.fecha_inicio = fecha_inicio

        cambio = AuditoriaService.construir_cambio(
            trabajo.titulo_trabajo,
            titulo
        )
        if cambio:
            cambios["titulo_trabajo"] = cambio
            trabajo.titulo_trabajo = titulo

        cambio = AuditoriaService.construir_cambio(
            trabajo.nombre_reunion,
            nombre_reunion
        )
        if cambio:
            cambios["nombre_reunion"] = cambio
            trabajo.nombre_reunion = nombre_reunion

        cambio = AuditoriaService.construir_cambio(
            trabajo.procedencia,
            procedencia
        )
        if cambio:
            cambios["procedencia"] = cambio
            trabajo.procedencia = procedencia

        cambio = AuditoriaService.construir_cambio(
            trabajo.tipo_reunion_id,
            tipo_reunion_id
        )
        if cambio:
            cambios["tipo_reunion_id"] = cambio
            trabajo.tipo_reunion_id = tipo_reunion_id

        cambio = AuditoriaService.construir_cambio(
            trabajo.grupo_utn_id,
            grupo_utn_id
        )
        if cambio:
            cambios["grupo_utn_id"] = cambio
            trabajo.grupo_utn_id = grupo_utn_id

        if cambios:
            trabajo.mark_updated(user_id)
            AuditoriaService.registrar_cambios(
                entidad="trabajo_reunion_cientifica",
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
        TrabajoReunionCientificaService._validar_user_id(user_id)
        trabajo = TrabajoReunionCientificaService._get_activo_or_404(trabajo_id)
        trabajo.soft_delete(user_id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Trabajo eliminado correctamente (soft delete)"}

    @staticmethod
    def restore(trabajo_id: int):
        trabajo = TrabajoReunionCientificaService._get_or_404(trabajo_id)

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
        trabajo = TrabajoReunionCientificaService._get_activo_or_404(trabajo_id)
        investigadores_ids = (
            TrabajoReunionCientificaService._validar_investigadores_ids(
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
            raise ValueError("Uno o mas investigadores no existen o estan eliminados")

        hubo_cambios = False
        for inv in investigadores:
            if inv not in trabajo.investigadores:
                trabajo.investigadores.append(inv)
                hubo_cambios = True
                AuditoriaService.registrar_evento_relacion(
                    entidad="trabajo_reunion_cientifica",
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
        trabajo = TrabajoReunionCientificaService._get_activo_or_404(trabajo_id)
        investigadores_ids = (
            TrabajoReunionCientificaService._validar_investigadores_ids(
                investigadores_ids
            )
        )

        hubo_cambios = False
        for inv in trabajo.investigadores[:]:
            if inv.id in investigadores_ids:
                trabajo.investigadores.remove(inv)
                hubo_cambios = True
                AuditoriaService.registrar_evento_relacion(
                    entidad="trabajo_reunion_cientifica",
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
        trabajos = TrabajoReunionCientifica.query.filter().all()

        snapshots = []
        for trabajo in trabajos:
            if not esta_en_periodo_memoria(memoria_version, trabajo.fecha_inicio):
                continue
            investigadores_participantes = ", ".join(sorted([
                investigador.nombre_apellido
                for investigador in trabajo.investigadores
                if getattr(investigador, "deleted_at", None) is None
            ]))

            snapshot = TrabajoReunionCientificaMemoriaVersion(
                memoria_version_id=memoria_version.id,
                trabajo_reunion_id=trabajo.id,
                titulo_trabajo=trabajo.titulo_trabajo,
                nombre_reunion=trabajo.nombre_reunion,
                procedencia=trabajo.procedencia,
                fecha_inicio=trabajo.fecha_inicio,
                tipo_reunion_id=trabajo.tipo_reunion_id,
                tipo_reunion_nombre=(
                    trabajo.tipo_reunion_cientifica.nombre
                    if trabajo.tipo_reunion_cientifica else None
                ),
                grupo_utn_id=trabajo.grupo_utn_id,
                grupo_utn_nombre=(
                    trabajo.grupo_utn.nombre_sigla_grupo
                    if trabajo.grupo_utn else None
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
            TrabajoReunionCientificaMemoriaVersion.query
            .filter(
                TrabajoReunionCientificaMemoriaVersion.memoria_version_id == memoria_version_id,
                TrabajoReunionCientificaMemoriaVersion.deleted_at.is_(None)
            )
            .order_by(
                TrabajoReunionCientificaMemoriaVersion.fecha_inicio.desc(),
                TrabajoReunionCientificaMemoriaVersion.id.desc()
            )
            .all()
        )

        return [snapshot.serialize() for snapshot in snapshots]
