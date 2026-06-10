from flask import Request, Response, jsonify, g
from core.services.programa_actividades_service import (
    crear_planificacion_grupo,
    actualizar_planificacion_grupo,
    eliminar_planificacion_grupo,
    listar_planificaciones,
    obtener_planificacion_por_id
)


class PlanificacionGrupoController:

    @staticmethod
    def crear(req: Request) -> Response:
        data = req.get_json()
        try:
            user_id = g.current_user_id
            plan = crear_planificacion_grupo(data, user_id)
            return jsonify(plan.serialize()), 201
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Internal Error: {str(e)}"}), 500

    @staticmethod
    def listar(req: Request) -> Response:
        try:
            activos = req.args.get("activos")
            planes = listar_planificaciones(activos)
            return jsonify([p.serialize() for p in planes]), 200
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Internal Error: {str(e)}"}), 500

    @staticmethod
    def obtener_por_id(req: Request, id: int) -> Response:
        try:
            plan = obtener_planificacion_por_id(id)
            return jsonify(plan.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def actualizar(req: Request, id: int) -> Response:
        data = req.get_json()
        try:
            plan = actualizar_planificacion_grupo(id, data)
            return jsonify(plan.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def eliminar(req: Request, id: int) -> Response:
        try:
            if not hasattr(g, "current_user_id"):
                return jsonify({"error": "Usuario no autenticado"}), 401
            eliminar_planificacion_grupo(id, g.current_user_id)
            return jsonify(
                {"message": "Planificación eliminada correctamente"}
            ), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
