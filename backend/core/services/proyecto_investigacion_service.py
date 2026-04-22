from datetime import datetime, date
from extension import db
from sqlalchemy import func, or_

from core.models.distinciones import DistincionRecibida
from core.models.proyecto_investigacion import (
    ProyectoInvestigacion,
    TipoProyecto,
    InvestigadorProyecto,
    BecarioProyecto
)
from core.models.grupo import GrupoInvestigacionUtn
from core.models.fuente_financiamiento import FuenteFinanciamiento
from core.models.programa_actividades import PlanificacionGrupo
from core.models.personal import Becario, Investigador


class ProyectoInvestigacionService:

    @staticmethod
    def _validar_id(valor, campo: str):
        if not isinstance(valor, int) or valor <= 0:
            raise ValueError(f"El campo '{campo}' debe ser un entero positivo")
        return valor

    @staticmethod
    def _validar_bool(valor, campo: str, default=False):
        if valor is None:
            return default
        if not isinstance(valor, bool):
            raise ValueError(f"El campo '{campo}' debe ser booleano")
        return valor

    @staticmethod
    def _normalizar_activos(activos):
        if activos is None:
            return "true"
        return str(activos).strip().lower()

    @staticmethod
    def _validar_fecha_participacion(fecha_str, campo: str, permitir_none=False):
        if fecha_str is None and permitir_none:
            return None

        try:
            return datetime.strptime(fecha_str, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            raise ValueError(
                f"El campo '{campo}' debe tener formato YYYY-MM-DD"
            )

    @staticmethod
    def _validar_investigador_activo(investigador_id):
        investigador_id = ProyectoInvestigacionService._validar_id(
            investigador_id, "id_investigador"
        )
        investigador = db.session.get(Investigador, investigador_id)
        if not investigador or investigador.deleted_at is not None:
            raise ValueError("Investigador invalido")
        return investigador_id

    @staticmethod
    def _get_proyecto_activo_or_404(proyecto_id: int):
        proyecto = ProyectoInvestigacion.query.filter_by(
            id=proyecto_id,
            deleted_at=None
        ).first()

        if not proyecto:
            raise ValueError("Proyecto no encontrado.")

        return proyecto

    @staticmethod
    def _get_proyecto_or_404(proyecto_id: int):
        proyecto = db.session.get(
            ProyectoInvestigacion,
            ProyectoInvestigacionService._validar_id(proyecto_id, "proyecto_id")
        )

        if not proyecto:
            raise ValueError("Proyecto no encontrado.")

        return proyecto

    @staticmethod
    def _proyecto_esta_cerrado(proyecto: ProyectoInvestigacion):
        return bool(proyecto.fecha_fin and proyecto.fecha_fin <= date.today())

    @staticmethod
    def _validar_proyecto_abierto(proyecto: ProyectoInvestigacion):
        if ProyectoInvestigacionService._proyecto_esta_cerrado(proyecto):
            raise ValueError("El proyecto se encuentra cerrado.")

    @staticmethod
    def _validar_unico_coordinador_activo(
        proyecto_id: int,
        nuevas_participaciones: list[dict]
    ):
        coordinador_activo_existente = InvestigadorProyecto.query.filter(
            InvestigadorProyecto.id_proyecto == proyecto_id,
            InvestigadorProyecto.deleted_at.is_(None),
            InvestigadorProyecto.es_coordinador.is_(True)
        ).first()

        coordinadores_nuevos = [
            item for item in nuevas_participaciones
            if ProyectoInvestigacionService._validar_bool(
                item.get("es_coordinador"), "es_coordinador", default=False
            )
        ]

        if len(coordinadores_nuevos) > 1:
            raise ValueError(
                "Un proyecto solo puede tener un investigador coordinador activo"
            )

        if coordinador_activo_existente and coordinadores_nuevos:
            if (
                coordinadores_nuevos[0].get("id_investigador")
                == coordinador_activo_existente.id_investigador
            ):
                return
            raise ValueError(
                "El proyecto ya tiene un investigador coordinador activo"
            )

    @staticmethod
    def _participacion_investigador_es_igual(
        participacion: InvestigadorProyecto,
        es_coordinador: bool,
        fecha_inicio: date,
        fecha_fin: date | None
    ):
        return (
            participacion.es_coordinador == es_coordinador
            and participacion.fecha_inicio == fecha_inicio
            and participacion.fecha_fin == fecha_fin
        )

    # =========================
    # GET ALL
    # =========================
    @staticmethod
    def get_all(filters: dict = None):
        filters = filters or {}
        query = ProyectoInvestigacion.query

        activos = ProyectoInvestigacionService._normalizar_activos(
            filters.get("activos")
        )
        if activos == "true":
            query = query.filter(
                ProyectoInvestigacion.deleted_at.is_(None),
                ProyectoInvestigacion.activo.is_(True)
            )
        elif activos == "false":
            query = query.filter(
                or_(
                    ProyectoInvestigacion.deleted_at.isnot(None),
                    ProyectoInvestigacion.activo.is_(False)
                )
            )
        elif activos != "all":
            query = query.filter(
                ProyectoInvestigacion.deleted_at.is_(None),
                ProyectoInvestigacion.activo.is_(True)
            )

        if filters.get("tipo_proyecto_id"):
            query = query.filter(
                ProyectoInvestigacion.tipo_proyecto_id == filters["tipo_proyecto_id"]
            )

        if filters.get("grupo_utn_id"):
            query = query.filter(
                ProyectoInvestigacion.grupo_utn_id == filters["grupo_utn_id"]
            )

        if filters.get("tiene_distinciones"):
            query = query.filter(
                ProyectoInvestigacion.distinciones.any(
                    DistincionRecibida.deleted_at.is_(None)
                )
            )

        orden = filters.get("orden")

        if orden == "asc":
            query = query.order_by(ProyectoInvestigacion.fecha_inicio.asc())
        elif orden == "monto_asc":
            query = query.order_by(ProyectoInvestigacion.monto_destinado.asc())
        elif orden == "monto_desc":
            query = query.order_by(ProyectoInvestigacion.monto_destinado.desc())
        else:
            query = query.order_by(ProyectoInvestigacion.fecha_inicio.desc())

        return [p.serialize() for p in query.all()]

    # =========================
    # GET BY ID
    # =========================
    @staticmethod
    def get_by_id(proyecto_id: int):

        proyecto = ProyectoInvestigacion.query.get(proyecto_id)

        if not proyecto:
            raise Exception("Proyecto de investigaciÃ³n no encontrado")

        return proyecto.serialize()

    # =========================
    # CREATE
    # =========================
    @staticmethod
    def create(data: dict, user_id: int):

        if not isinstance(data.get("codigo_proyecto"), int):
            raise ValueError("codigo_proyecto debe ser entero")

        fecha_inicio = datetime.strptime(
            data["fecha_inicio"], "%Y-%m-%d"
        ).date()

        fecha_fin = None
        if data.get("fecha_fin"):
            fecha_fin = datetime.strptime(
                data["fecha_fin"], "%Y-%m-%d"
            ).date()
            if fecha_fin < fecha_inicio:
                raise Exception("La fecha fin no puede ser anterior a la fecha inicio")

        if not TipoProyecto.query.get(data.get("tipo_proyecto_id")):
            raise Exception("Tipo de proyecto invÃ¡lido")
        
        if data.get("planificacion_id"):
            planificacion = PlanificacionGrupo.query.get(data["planificacion_id"])
            if not planificacion:
                raise ValueError("PlanificaciÃ³n invÃ¡lida")
            
        if data.get("fuente_financiamiento_id"):
            fuente = FuenteFinanciamiento.query.get(data["fuente_financiamiento_id"])
            if not fuente:
                raise ValueError("Fuente de financiamiento invÃ¡lida")
            
        if data.get("grupo_utn_id"):
            grupo = GrupoInvestigacionUtn.query.get(data["grupo_utn_id"])
            if not grupo:
                raise ValueError("Grupo UTN invÃ¡lido")
            
        if data.get("tipo_proyecto_id"):
            tipo = TipoProyecto.query.get(data["tipo_proyecto_id"])
            if not tipo:
                raise ValueError("Tipo de proyecto invÃ¡lido")

        proyecto = ProyectoInvestigacion(
            codigo_proyecto=data["codigo_proyecto"],
            nombre_proyecto=data["nombre_proyecto"],
            descripcion_proyecto=data["descripcion_proyecto"],
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            dificultades_proyecto=data.get("dificultades_proyecto"),
            monto_destinado=data.get("monto_destinado"),
            tipo_proyecto_id=data["tipo_proyecto_id"],
            grupo_utn_id=data.get("grupo_utn_id"),
            fuente_financiamiento_id=data.get("fuente_financiamiento_id"),
            planificacion_id=data.get("planificacion_id"),
            created_by=user_id
        )

        db.session.add(proyecto)
        db.session.commit()

        return proyecto.serialize()

    # =========================
    # UPDATE
    # =========================
    @staticmethod
    def update(proyecto_id: int, data: dict, user_id: int = None):

        proyecto = ProyectoInvestigacion.query.filter_by(
            id=proyecto_id,
            deleted_at=None
        ).first()

        if not proyecto:
            raise Exception("Proyecto no encontrado")

        if user_id is not None:
            ProyectoInvestigacionService._validar_id(user_id, "user_id")

        es_cierre_por_update = (
            user_id is not None and
            set(data.keys()) == {"fecha_fin"} and
            data.get("fecha_fin")
        )

        for field in [
            "codigo_proyecto",
            "nombre_proyecto",
            "descripcion_proyecto",
            "dificultades_proyecto",
            "monto_destinado"
        ]:
            if field in data:
                setattr(proyecto, field, data[field])

        if "tipo_proyecto_id" in data:
            tipo_proyecto_id = data["tipo_proyecto_id"]
            if not isinstance(tipo_proyecto_id, int) or tipo_proyecto_id <= 0:
                raise ValueError("Tipo de proyecto inválido")

            if not TipoProyecto.query.get(tipo_proyecto_id):
                raise ValueError("Tipo de proyecto inválido")

            proyecto.tipo_proyecto_id = tipo_proyecto_id

        if "grupo_utn_id" in data:
            grupo_utn_id = data["grupo_utn_id"]
            if grupo_utn_id in (None, ""):
                proyecto.grupo_utn_id = None
            else:
                if not isinstance(grupo_utn_id, int) or grupo_utn_id <= 0:
                    raise ValueError("Grupo UTN inválido")

                if not GrupoInvestigacionUtn.query.get(grupo_utn_id):
                    raise ValueError("Grupo UTN inválido")

                proyecto.grupo_utn_id = grupo_utn_id

        if "fuente_financiamiento_id" in data:
            fuente_financiamiento_id = data["fuente_financiamiento_id"]
            if fuente_financiamiento_id in (None, ""):
                proyecto.fuente_financiamiento_id = None
            else:
                if (
                    not isinstance(fuente_financiamiento_id, int)
                    or fuente_financiamiento_id <= 0
                ):
                    raise ValueError("Fuente de financiamiento inválida")

                if not FuenteFinanciamiento.query.get(fuente_financiamiento_id):
                    raise ValueError("Fuente de financiamiento inválida")

                proyecto.fuente_financiamiento_id = fuente_financiamiento_id

        if "planificacion_id" in data:
            planificacion_id = data["planificacion_id"]
            if planificacion_id in (None, ""):
                proyecto.planificacion_id = None
            else:
                if not isinstance(planificacion_id, int) or planificacion_id <= 0:
                    raise ValueError("Planificación inválida")

                if not PlanificacionGrupo.query.get(planificacion_id):
                    raise ValueError("Planificación inválida")

                proyecto.planificacion_id = planificacion_id

        if "fecha_inicio" in data:
            proyecto.fecha_inicio = datetime.strptime(
                data["fecha_inicio"], "%Y-%m-%d"
            ).date()

        if "fecha_fin" in data:
            proyecto.fecha_fin = (
                datetime.strptime(data["fecha_fin"], "%Y-%m-%d").date()
                if data["fecha_fin"]
                else None
            )

        if proyecto.fecha_fin and proyecto.fecha_fin < proyecto.fecha_inicio:
            raise Exception("La fecha fin no puede ser anterior a la fecha inicio")

        if es_cierre_por_update:
            if proyecto.fecha_fin > date.today():
                raise ValueError(
                    "No se puede cerrar el proyecto con una fecha futura"
                )
            proyecto.soft_delete(user_id)

        db.session.commit()
        return proyecto.serialize()

    # =========================
    # CERRAR PROYECTO
    # =========================
    @staticmethod
    def cerrar_proyecto(proyecto_id: int, user_id: int):
        proyecto = ProyectoInvestigacionService._get_proyecto_activo_or_404(
            proyecto_id
        )
        ProyectoInvestigacionService._validar_id(user_id, "user_id")

        if ProyectoInvestigacionService._proyecto_esta_cerrado(proyecto):
            raise ValueError("El proyecto ya se encuentra cerrado")

        proyecto.fecha_fin = func.current_date()
        proyecto.soft_delete(user_id)
        db.session.commit()

        return {"message": "Proyecto cerrado correctamente"}

    # =========================
    # REABRIR PROYECTO
    # =========================
    @staticmethod
    def reabrir_proyecto(proyecto_id: int):
        proyecto = ProyectoInvestigacionService._get_proyecto_or_404(
            proyecto_id
        )
        if proyecto.deleted_at is None and not ProyectoInvestigacionService._proyecto_esta_cerrado(proyecto):
            raise ValueError("El proyecto no se encuentra cerrado")

        proyecto.restore()
        proyecto.fecha_fin = None
        db.session.commit()

        return {"message": "Proyecto reabierto correctamente"}

    # =====================================================
    # VINCULAR / DESVINCULAR INVESTIGADORES
    # =====================================================

    @staticmethod
    def vincular_investigadores_a_proyecto(proyecto_id, participaciones):
        proyecto = ProyectoInvestigacionService._get_proyecto_activo_or_404(
            proyecto_id
        )
        ProyectoInvestigacionService._validar_proyecto_abierto(proyecto)

        if not isinstance(participaciones, list) or not participaciones:
            raise ValueError("Debe enviarse una lista de participaciones.")

        ProyectoInvestigacionService._validar_unico_coordinador_activo(
            proyecto_id,
            participaciones
        )

        for item in participaciones:

            investigador_id = ProyectoInvestigacionService._validar_investigador_activo(
                item.get("id_investigador")
            )
            es_coordinador = ProyectoInvestigacionService._validar_bool(
                item.get("es_coordinador"), "es_coordinador", default=False
            )
            fecha_inicio = ProyectoInvestigacionService._validar_fecha_participacion(
                item.get("fecha_inicio"), "fecha_inicio"
            )
            fecha_fin = ProyectoInvestigacionService._validar_fecha_participacion(
                item.get("fecha_fin"), "fecha_fin", permitir_none=True
            )

            if fecha_fin and fecha_fin < fecha_inicio:
                raise ValueError(
                    "La fecha_fin no puede ser anterior a la fecha_inicio."
                )

            existente = InvestigadorProyecto.query.filter_by(
                id_proyecto=proyecto_id,
                id_investigador=investigador_id,
                deleted_at=None
            ).first()

            if existente:
                if ProyectoInvestigacionService._participacion_investigador_es_igual(
                    existente,
                    es_coordinador,
                    fecha_inicio,
                    fecha_fin
                ):
                    continue

                raise ValueError("Ya existe una participación activa.")

            nueva = InvestigadorProyecto(
                id_investigador=investigador_id,
                id_proyecto=proyecto_id,
                es_coordinador=es_coordinador,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin
            )

            db.session.add(nueva)

        db.session.commit()
        return proyecto.serialize()



    @staticmethod
    def desvincular_investigadores_de_proyecto(proyecto_id, participaciones, user_id):
        proyecto = ProyectoInvestigacionService._get_proyecto_activo_or_404(
            proyecto_id
        )
        ProyectoInvestigacionService._validar_proyecto_abierto(proyecto)

        if not isinstance(participaciones, list) or not participaciones:
            raise ValueError("Debe enviarse una lista de participaciones.")

        for item in participaciones:
            investigador_id = ProyectoInvestigacionService._validar_investigador_activo(
                item.get("id_investigador")
            )

            participacion = InvestigadorProyecto.query.filter_by(
                id_proyecto=proyecto_id,
                id_investigador=investigador_id,
                deleted_at=None
            ).first()

            if not participacion:
                raise ValueError("ParticipaciÃ³n activa no encontrada.")

            # ðŸ”¹ LÃ³gica de negocio
            participacion.fecha_fin = date.today()

            # ðŸ”¹ LÃ³gica de auditorÃ­a
            participacion.soft_delete(user_id=user_id)

        db.session.commit()
        return proyecto.serialize()

    # =====================================================
    # VINCULAR / DESVINCULAR BECARIOS
    # =====================================================

    @staticmethod
    def vincular_becarios_a_proyecto(proyecto_id, participaciones):
        proyecto = ProyectoInvestigacionService._get_proyecto_activo_or_404(
            proyecto_id
        )
        ProyectoInvestigacionService._validar_proyecto_abierto(proyecto)

        for item in participaciones:

            becario_id = item.get("id_becario")

            existente = BecarioProyecto.query.filter_by(
                id_proyecto=proyecto_id,
                id_becario=becario_id,
                deleted_at=None
            ).first()

            if existente:
                raise ValueError("Ya existe participaciÃ³n activa.")

            nueva = BecarioProyecto(
                id_becario=becario_id,
                id_proyecto=proyecto_id,
                fecha_inicio=datetime.strptime(
                    item["fecha_inicio"], "%Y-%m-%d"
                ).date(),
                fecha_fin=datetime.strptime(
                    item["fecha_fin"], "%Y-%m-%d"
                ).date() if item.get("fecha_fin") else None
            )

            db.session.add(nueva)

        db.session.commit()
        return proyecto.serialize()

    @staticmethod
    def desvincular_becarios_de_proyecto(proyecto_id, participaciones, user_id):
        proyecto = ProyectoInvestigacionService._get_proyecto_activo_or_404(
            proyecto_id
        )
        ProyectoInvestigacionService._validar_proyecto_abierto(proyecto)

        for item in participaciones:

            participacion = BecarioProyecto.query.filter_by(
                id_proyecto=proyecto_id,
                id_becario=item.get("id_becario"),
                deleted_at=None
            ).first()

            if not participacion:
                raise ValueError("ParticipaciÃ³n activa no encontrada.")

            participacion.fecha_fin = date.today()
            participacion.soft_delete(user_id=user_id)

        db.session.commit()
        return proyecto.serialize()


