from flask import Request, Response, g, jsonify

from modules.grupo.services.programa_actividades_service import (
    actualizar_planificacion_grupo,
    crear_planificacion_grupo,
    eliminar_planificacion_grupo,
    listar_planificaciones,
    obtener_historial_planificacion,
    obtener_planificacion_por_id,
)
from modules.shared.controllers.responses import exception_response


class PlanificacionGrupoController:
    @staticmethod
    def crear(req: Request) -> Response:
        try:
            plan = crear_planificacion_grupo(req.get_json(), g.current_user_id)
            return jsonify(plan.serialize()), 201
        except Exception as error:
            return exception_response(error, operation="crear planificacion de grupo")

    @staticmethod
    def listar(req: Request) -> Response:
        try:
            planes = listar_planificaciones(req.args.get("activos"))
            return jsonify([p.serialize() for p in planes]), 200
        except Exception as error:
            return exception_response(error, operation="listar planificaciones de grupo")

    @staticmethod
    def obtener_por_id(req: Request, id: int) -> Response:
        try:
            return jsonify(obtener_planificacion_por_id(id).serialize()), 200
        except Exception as error:
            return exception_response(error, operation="consultar planificacion de grupo")

    @staticmethod
    def actualizar(req: Request, id: int) -> Response:
        try:
            plan = actualizar_planificacion_grupo(id, req.get_json(), g.current_user_id)
            return jsonify(plan.serialize()), 200
        except Exception as error:
            return exception_response(error, operation="actualizar planificacion de grupo")

    @staticmethod
    def historial(req: Request, id: int) -> Response:
        try:
            return jsonify(obtener_historial_planificacion(id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar historial de planificacion")

    @staticmethod
    def eliminar(req: Request, id: int) -> Response:
        try:
            eliminar_planificacion_grupo(id, g.current_user_id)
            return jsonify({"message": "Planificación eliminada correctamente"}), 200
        except Exception as error:
            return exception_response(error, operation="eliminar planificacion de grupo")
