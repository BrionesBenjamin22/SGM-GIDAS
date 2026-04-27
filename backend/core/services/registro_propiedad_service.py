from datetime import datetime, date

from sqlalchemy import or_

from extension import db
from core.models.registro_patente import (
    RegistrosPropiedad,
    TipoRegistroPropiedad,
    RegistrosPropiedadMemoriaVersion,
)
from core.models.grupo import GrupoInvestigacionUtn
from core.services.auditoria_service import AuditoriaService
from core.services.memoria_periodo_service import estuvo_activo_en_periodo_memoria


class RegistrosPropiedadService:

    # =========================
    # HELPERS
    # =========================
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
        return " ".join(valor.strip().split())

    @staticmethod
    def _normalizar_activos(activos):
        if activos is None:
            return "true"
        return str(activos).strip().lower()

    @staticmethod
    def _validar_fecha(fecha_str: str):
        try:
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        except (KeyError, TypeError, ValueError):
            raise ValueError(
                "fecha_registro es obligatoria y debe tener formato YYYY-MM-DD"
            )

        if fecha > date.today():
            raise ValueError("fecha_registro no puede ser futura")

        return fecha

    @staticmethod
    def _get_or_404(registro_id: int):
        registro = db.session.get(
            RegistrosPropiedad,
            RegistrosPropiedadService._validar_id(registro_id, "registro_id")
        )
        if not registro:
            raise ValueError("Registro de propiedad no encontrado")
        return registro

    @staticmethod
    def _validar_tipo_registro(tipo_registro_id):
        tipo_registro_id = RegistrosPropiedadService._validar_id(
            tipo_registro_id, "tipo_registro_id"
        )
        tipo_registro = db.session.get(TipoRegistroPropiedad, tipo_registro_id)
        if not tipo_registro:
            raise ValueError("tipo_registro_id invalido")
        return tipo_registro.id

    @staticmethod
    def _validar_grupo(grupo_utn_id):
        grupo_utn_id = RegistrosPropiedadService._validar_id(
            grupo_utn_id, "grupo_utn_id"
        )
        grupo = db.session.get(GrupoInvestigacionUtn, grupo_utn_id)
        if not grupo or grupo.deleted_at is not None:
            raise ValueError("grupo_utn_id invalido")
        return grupo.id

    # =========================
    # LISTAR
    # =========================
    @staticmethod
    def get_all(activos: str = "true"):
        query = RegistrosPropiedad.query

        activos = RegistrosPropiedadService._normalizar_activos(activos)

        if activos == "true":
            query = query.filter(
                RegistrosPropiedad.deleted_at.is_(None),
                RegistrosPropiedad.activo.is_(True)
            )
        elif activos == "false":
            query = query.filter(
                or_(
                    RegistrosPropiedad.deleted_at.isnot(None),
                    RegistrosPropiedad.activo.is_(False)
                )
            )
        elif activos == "all":
            pass
        else:
            query = query.filter(
                RegistrosPropiedad.deleted_at.is_(None),
                RegistrosPropiedad.activo.is_(True)
            )

        return [r.serialize() for r in query.all()]

    # =========================
    # OBTENER POR ID
    # =========================
    @staticmethod
    def get_by_id(registro_id: int):
        registro = RegistrosPropiedadService._get_or_404(registro_id)
        return registro.serialize()

    @staticmethod
    def get_historial(registro_id: int):
        registro = RegistrosPropiedadService._get_or_404(registro_id)
        return AuditoriaService.obtener_historial_entidad(
            entidad="registro_propiedad",
            registro_id=registro.id
        )

    # =========================
    # CREAR
    # =========================
    @staticmethod
    def create(data: dict, user_id: int):
        RegistrosPropiedadService._validar_payload(data)
        RegistrosPropiedadService._validar_id(user_id, "user_id")

        fecha_registro = RegistrosPropiedadService._validar_fecha(
            data.get("fecha_registro")
        )

        nuevo = RegistrosPropiedad(
            nombre_articulo=RegistrosPropiedadService._validar_texto(
                data.get("nombre_articulo"), "nombre_articulo"
            ),
            organismo_registrante=RegistrosPropiedadService._validar_texto(
                data.get("organismo_registrante"), "organismo_registrante"
            ),
            fecha_registro=fecha_registro,
            tipo_registro_id=RegistrosPropiedadService._validar_tipo_registro(
                data.get("tipo_registro_id")
            ),
            grupo_utn_id=RegistrosPropiedadService._validar_grupo(
                data.get("grupo_utn_id")
            ),
            created_by=user_id,
        )

        db.session.add(nuevo)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return nuevo.serialize()

    # =========================
    # ACTUALIZAR
    # =========================
    @staticmethod
    def update(registro_id: int, data: dict, user_id: int):
        RegistrosPropiedadService._validar_payload(data)
        RegistrosPropiedadService._validar_id(user_id, "user_id")
        registro = RegistrosPropiedadService._get_or_404(registro_id)
        cambios = {}

        if not registro.activo:
            raise ValueError(
                "No se puede modificar un registro eliminado. Restaurarlo primero."
            )

        if "nombre_articulo" in data:
            nuevo_valor = RegistrosPropiedadService._validar_texto(
                data.get("nombre_articulo"), "nombre_articulo"
            )
            cambio = AuditoriaService.construir_cambio(
                registro.nombre_articulo,
                nuevo_valor
            )
            if cambio:
                cambios["nombre_articulo"] = cambio
                registro.nombre_articulo = nuevo_valor

        if "organismo_registrante" in data:
            nuevo_valor = RegistrosPropiedadService._validar_texto(
                data.get("organismo_registrante"), "organismo_registrante"
            )
            cambio = AuditoriaService.construir_cambio(
                registro.organismo_registrante,
                nuevo_valor
            )
            if cambio:
                cambios["organismo_registrante"] = cambio
                registro.organismo_registrante = nuevo_valor

        if "tipo_registro_id" in data:
            nuevo_valor = RegistrosPropiedadService._validar_tipo_registro(
                data.get("tipo_registro_id")
            )
            cambio = AuditoriaService.construir_cambio(
                registro.tipo_registro_id,
                nuevo_valor
            )
            if cambio:
                cambios["tipo_registro_id"] = cambio
                registro.tipo_registro_id = nuevo_valor

        if "grupo_utn_id" in data:
            nuevo_valor = RegistrosPropiedadService._validar_grupo(
                data.get("grupo_utn_id")
            )
            cambio = AuditoriaService.construir_cambio(
                registro.grupo_utn_id,
                nuevo_valor
            )
            if cambio:
                cambios["grupo_utn_id"] = cambio
                registro.grupo_utn_id = nuevo_valor

        if "fecha_registro" in data:
            try:
                nuevo_valor = datetime.strptime(data["fecha_registro"], "%Y-%m-%d").date()
            except (TypeError, ValueError):
                raise ValueError("fecha_registro debe tener formato YYYY-MM-DD")

            if nuevo_valor > date.today():
                raise ValueError("fecha_registro no puede ser futura")

            cambio = AuditoriaService.construir_cambio(
                registro.fecha_registro,
                nuevo_valor
            )
            if cambio:
                cambios["fecha_registro"] = cambio
                registro.fecha_registro = nuevo_valor

        if cambios:
            registro.mark_updated(user_id)
            AuditoriaService.registrar_cambios(
                entidad="registro_propiedad",
                registro_id=registro.id,
                cambios=cambios,
                user_id=user_id
            )

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return registro.serialize()

    # =========================
    # SOFT DELETE
    # =========================
    @staticmethod
    def delete(registro_id: int, user_id: int):
        RegistrosPropiedadService._validar_id(user_id, "user_id")
        registro = RegistrosPropiedadService._get_or_404(registro_id)

        if not registro.activo:
            raise ValueError("El registro ya se encuentra eliminado.")

        registro.soft_delete(user_id)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Registro eliminado correctamente (soft delete)"}

    # =========================
    # RESTORE
    # =========================
    @staticmethod
    def restore(registro_id: int):
        registro = RegistrosPropiedadService._get_or_404(registro_id)

        if registro.activo:
            raise ValueError("El registro ya se encuentra activo.")

        registro.restore()
        registro.activo = True

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return registro.serialize()

    @staticmethod
    def snapshot_para_memoria_version(memoria_version, user_id):
        registros = RegistrosPropiedad.query.filter().all()

        snapshots = []
        for registro in registros:
            if not estuvo_activo_en_periodo_memoria(
                memoria_version,
                registro.fecha_registro,
                getattr(registro, "deleted_at", None)
            ):
                continue
            snapshot = RegistrosPropiedadMemoriaVersion(
                memoria_version_id=memoria_version.id,
                registro_propiedad_id=registro.id,
                nombre_articulo=registro.nombre_articulo,
                organismo_registrante=registro.organismo_registrante,
                fecha_registro=registro.fecha_registro,
                tipo_registro_id=registro.tipo_registro_id,
                tipo_registro_nombre=(
                    registro.tipo_registro.nombre
                    if registro.tipo_registro else None
                ),
                grupo_utn_id=registro.grupo_utn_id,
                grupo_utn_nombre=(
                    registro.grupo_utn.nombre_sigla_grupo
                    if registro.grupo_utn else None
                ),
                created_by=user_id
            )
            db.session.add(snapshot)
            snapshots.append(snapshot)

        return snapshots

    @staticmethod
    def obtener_snapshots_por_memoria_version(memoria_version_id: int):
        snapshots = (
            RegistrosPropiedadMemoriaVersion.query
            .filter(
                RegistrosPropiedadMemoriaVersion.memoria_version_id == memoria_version_id,
                RegistrosPropiedadMemoriaVersion.deleted_at.is_(None)
            )
            .order_by(
                RegistrosPropiedadMemoriaVersion.fecha_registro.desc(),
                RegistrosPropiedadMemoriaVersion.id.desc()
            )
            .all()
        )

        return [snapshot.serialize() for snapshot in snapshots]
