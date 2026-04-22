from datetime import datetime, date

from sqlalchemy import or_

from extension import db
from core.models.registro_patente import RegistrosPropiedad, TipoRegistroPropiedad
from core.models.grupo import GrupoInvestigacionUtn


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
    def update(registro_id: int, data: dict):
        RegistrosPropiedadService._validar_payload(data)
        registro = RegistrosPropiedadService._get_or_404(registro_id)

        if not registro.activo:
            raise ValueError(
                "No se puede modificar un registro eliminado. Restaurarlo primero."
            )

        if "nombre_articulo" in data:
            registro.nombre_articulo = RegistrosPropiedadService._validar_texto(
                data.get("nombre_articulo"), "nombre_articulo"
            )

        if "organismo_registrante" in data:
            registro.organismo_registrante = RegistrosPropiedadService._validar_texto(
                data.get("organismo_registrante"), "organismo_registrante"
            )

        if "tipo_registro_id" in data:
            registro.tipo_registro_id = RegistrosPropiedadService._validar_tipo_registro(
                data.get("tipo_registro_id")
            )

        if "grupo_utn_id" in data:
            registro.grupo_utn_id = RegistrosPropiedadService._validar_grupo(
                data.get("grupo_utn_id")
            )

        if "fecha_registro" in data:
            try:
                fecha = datetime.strptime(data["fecha_registro"], "%Y-%m-%d").date()
            except (TypeError, ValueError):
                raise ValueError("fecha_registro debe tener formato YYYY-MM-DD")

            if fecha > date.today():
                raise ValueError("fecha_registro no puede ser futura")

            registro.fecha_registro = fecha

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
