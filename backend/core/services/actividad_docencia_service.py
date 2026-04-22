from datetime import date, datetime

from core.models.actividad_docencia import (
    ActividadDocencia,
    GradoAcademico,
    InvestigadorActividadGrado,
    RolActividad,
)
from core.models.personal import Investigador
from extension import db


class ActividadDocenciaService:

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
    def _validar_id(valor, campo):
        if not isinstance(valor, int) or valor <= 0:
            raise ValueError(f"El campo '{campo}' debe ser un entero positivo")
        return valor

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
    def _parse_fecha(valor, campo):
        try:
            return datetime.strptime(valor, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            raise ValueError(
                f"El campo '{campo}' es obligatorio y debe tener formato YYYY-MM-DD"
            )

    @staticmethod
    def _validar_fechas(fecha_inicio, fecha_fin):
        if fecha_inicio > date.today():
            raise ValueError("La fecha de inicio no puede ser futura")

        if fecha_fin < fecha_inicio:
            raise ValueError(
                "La fecha de fin no puede ser anterior a la fecha de inicio"
            )

    @staticmethod
    def _normalizar_activos(activos):
        if activos is None:
            return "true"
        return str(activos).strip().lower()

    @staticmethod
    def _get_or_404(model, obj_id, message, permitir_eliminado=False):
        obj = db.session.get(model, obj_id)
        if not obj:
            raise ValueError(message)
        if not permitir_eliminado and getattr(obj, "deleted_at", None) is not None:
            raise ValueError(message)
        return obj

    @staticmethod
    def _obtener_actividad(actividad_id, permitir_eliminado=True):
        actividad_id = ActividadDocenciaService._validar_id(
            actividad_id, "actividad_id"
        )
        return ActividadDocenciaService._get_or_404(
            ActividadDocencia,
            actividad_id,
            "Actividad de docencia no encontrada",
            permitir_eliminado=permitir_eliminado
        )

    @staticmethod
    def _obtener_historial_activo_unico(actividad_id):
        historiales = InvestigadorActividadGrado.query.filter_by(
            actividad_docencia_id=actividad_id,
            fecha_fin=None
        ).all()

        if len(historiales) > 1:
            raise ValueError(
                "La actividad tiene mas de un historial de grado activo"
            )

        return historiales[0] if historiales else None

    @staticmethod
    def _validar_grado(grado_id):
        grado_id = ActividadDocenciaService._validar_id(
            grado_id, "grado_academico_id"
        )
        return ActividadDocenciaService._get_or_404(
            GradoAcademico,
            grado_id,
            "Grado academico invalido"
        )

    @staticmethod
    def _validar_rol(rol_id):
        rol_id = ActividadDocenciaService._validar_id(
            rol_id, "rol_actividad_id"
        )
        return ActividadDocenciaService._get_or_404(
            RolActividad,
            rol_id,
            "Rol de actividad invalido"
        )

    @staticmethod
    def _validar_investigador(investigador_id):
        investigador_id = ActividadDocenciaService._validar_id(
            investigador_id, "investigador_id"
        )
        return ActividadDocenciaService._get_or_404(
            Investigador,
            investigador_id,
            "Investigador invalido"
        )

    @staticmethod
    def _validar_no_duplicado(
        investigador_id,
        curso,
        institucion,
        fecha_inicio,
        fecha_fin,
        rol_actividad_id,
        actividad_id=None,
    ):
        query = ActividadDocencia.query.filter(
            ActividadDocencia.deleted_at.is_(None),
            ActividadDocencia.investigador_id == investigador_id,
            ActividadDocencia.curso == curso,
            ActividadDocencia.institucion == institucion,
            ActividadDocencia.fecha_inicio == fecha_inicio,
            ActividadDocencia.fecha_fin == fecha_fin,
            ActividadDocencia.rol_actividad_id == rol_actividad_id,
        )

        if actividad_id is not None:
            query = query.filter(ActividadDocencia.id != actividad_id)

        if query.first():
            raise ValueError(
                "Ya existe una actividad de docencia con los mismos datos para ese investigador"
            )

    @staticmethod
    def get_all(filters: dict = None):
        filters = filters or {}
        query = ActividadDocencia.query

        investigador_id = filters.get("investigador_id")
        if investigador_id is not None:
            investigador_id = ActividadDocenciaService._validar_id(
                investigador_id, "investigador_id"
            )
            query = query.filter(ActividadDocencia.investigador_id == investigador_id)

        activos = ActividadDocenciaService._normalizar_activos(filters.get("activos"))
        if activos == "true":
            query = query.filter(ActividadDocencia.deleted_at.is_(None))
        elif activos == "false":
            query = query.filter(ActividadDocencia.deleted_at.isnot(None))
        elif activos != "all":
            query = query.filter(ActividadDocencia.deleted_at.is_(None))

        orden = filters.get("orden")
        if orden == "asc":
            query = query.order_by(ActividadDocencia.fecha_inicio.asc())
        else:
            query = query.order_by(ActividadDocencia.fecha_inicio.desc())

        return [a.serialize() for a in query.all()]

    @staticmethod
    def get_by_id(actividad_id: int):
        return ActividadDocenciaService._obtener_actividad(
            actividad_id,
            permitir_eliminado=True
        ).serialize()

    @staticmethod
    def create(data: dict, user_id: int):
        ActividadDocenciaService._validar_payload(data)
        ActividadDocenciaService._validar_user_id(user_id)

        fecha_inicio = ActividadDocenciaService._parse_fecha(
            data.get("fecha_inicio"), "fecha_inicio"
        )
        fecha_fin = ActividadDocenciaService._parse_fecha(
            data.get("fecha_fin"), "fecha_fin"
        )
        ActividadDocenciaService._validar_fechas(fecha_inicio, fecha_fin)

        curso = ActividadDocenciaService._validar_texto(
            data.get("curso"), "curso", min_len=3
        )
        institucion = ActividadDocenciaService._validar_texto(
            data.get("institucion"), "institucion", min_len=3
        )
        grado = ActividadDocenciaService._validar_grado(data.get("grado_academico_id"))
        rol = ActividadDocenciaService._validar_rol(data.get("rol_actividad_id"))
        investigador = ActividadDocenciaService._validar_investigador(
            data.get("investigador_id")
        )

        ActividadDocenciaService._validar_no_duplicado(
            investigador.id,
            curso,
            institucion,
            fecha_inicio,
            fecha_fin,
            rol.id,
        )

        actividad = ActividadDocencia(
            curso=curso,
            institucion=institucion,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            rol_actividad_id=rol.id,
            investigador_id=investigador.id,
            created_by=user_id,
        )

        db.session.add(actividad)
        db.session.flush()

        historial = InvestigadorActividadGrado(
            investigador_id=investigador.id,
            actividad_docencia_id=actividad.id,
            grado_academico_id=grado.id,
            fecha_inicio=fecha_inicio,
            fecha_fin=None,
            created_by=user_id,
        )

        db.session.add(historial)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return actividad.serialize()

    @staticmethod
    def update(actividad_id: int, data: dict, user_id: int = None):
        ActividadDocenciaService._validar_payload(data)

        if user_id is not None:
            ActividadDocenciaService._validar_user_id(user_id)

        actividad = ActividadDocenciaService._obtener_actividad(
            actividad_id,
            permitir_eliminado=False
        )

        if "investigador_id" in data and "grado_academico_id" in data:
            raise ValueError(
                "No se puede actualizar investigador y grado academico en la misma operacion"
            )

        if "investigador_id" in data:
            nuevo_investigador = ActividadDocenciaService._validar_investigador(
                data["investigador_id"]
            )
            if nuevo_investigador.id != actividad.investigador_id:
                raise ValueError(
                    "No se puede cambiar el investigador de una actividad existente"
                )

        fecha_inicio = actividad.fecha_inicio
        fecha_fin = actividad.fecha_fin
        if "fecha_inicio" in data:
            fecha_inicio = ActividadDocenciaService._parse_fecha(
                data["fecha_inicio"], "fecha_inicio"
            )
        if "fecha_fin" in data:
            fecha_fin = ActividadDocenciaService._parse_fecha(
                data["fecha_fin"], "fecha_fin"
            )

        ActividadDocenciaService._validar_fechas(fecha_inicio, fecha_fin)

        curso = actividad.curso
        if "curso" in data:
            curso = ActividadDocenciaService._validar_texto(
                data["curso"], "curso", min_len=3
            )

        institucion = actividad.institucion
        if "institucion" in data:
            institucion = ActividadDocenciaService._validar_texto(
                data["institucion"], "institucion", min_len=3
            )

        rol_actividad_id = actividad.rol_actividad_id
        if "rol_actividad_id" in data:
            rol_actividad_id = ActividadDocenciaService._validar_rol(
                data["rol_actividad_id"]
            ).id

        ActividadDocenciaService._validar_no_duplicado(
            actividad.investigador_id,
            curso,
            institucion,
            fecha_inicio,
            fecha_fin,
            rol_actividad_id,
            actividad.id,
        )

        actividad.fecha_inicio = fecha_inicio
        actividad.fecha_fin = fecha_fin
        actividad.curso = curso
        actividad.institucion = institucion
        actividad.rol_actividad_id = rol_actividad_id

        historial_activo = ActividadDocenciaService._obtener_historial_activo_unico(
            actividad.id
        )

        if historial_activo and historial_activo.fecha_inicio > actividad.fecha_fin:
            raise ValueError(
                "El historial activo tiene una fecha de inicio invalida respecto de la actividad"
            )

        if "grado_academico_id" in data:
            nuevo_grado = ActividadDocenciaService._validar_grado(
                data["grado_academico_id"]
            )

            if not historial_activo:
                nuevo_historial = InvestigadorActividadGrado(
                    investigador_id=actividad.investigador_id,
                    actividad_docencia_id=actividad.id,
                    grado_academico_id=nuevo_grado.id,
                    fecha_inicio=date.today(),
                    fecha_fin=None,
                    created_by=user_id,
                )
                db.session.add(nuevo_historial)
            elif historial_activo.grado_academico_id != nuevo_grado.id:
                if historial_activo.fecha_inicio > date.today():
                    raise ValueError(
                        "El historial activo tiene una fecha de inicio invalida"
                    )

                historial_activo.fecha_fin = date.today()

                nuevo_historial = InvestigadorActividadGrado(
                    investigador_id=actividad.investigador_id,
                    actividad_docencia_id=actividad.id,
                    grado_academico_id=nuevo_grado.id,
                    fecha_inicio=date.today(),
                    fecha_fin=None,
                    created_by=user_id,
                )
                db.session.add(nuevo_historial)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return actividad.serialize()

    @staticmethod
    def delete(actividad_id: int, user_id: int):
        ActividadDocenciaService._validar_user_id(user_id)
        actividad = ActividadDocenciaService._obtener_actividad(
            actividad_id,
            permitir_eliminado=False
        )

        actividad.soft_delete(user_id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Actividad de docencia eliminada correctamente"}
