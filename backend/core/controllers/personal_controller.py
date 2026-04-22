from flask import Request, Response, jsonify, g
from core.services.personal_service import (
    crear_personal,
    actualizar_personal,
    eliminar_personal_por_rol,
    listar_personal
)
from core.services.personal_completo_service import (
    obtener_personal_por_tipo
)


class PersonalController:

    @staticmethod
    def crear(req: Request) -> Response:
        data = req.get_json(force=True, silent=False)

        try:
            if not hasattr(g, "current_user_id"):
                return jsonify({"error": "Usuario no autenticado"}), 401

            user_id = g.current_user_id  

            personal = crear_personal(data, user_id)

            return jsonify(personal.serialize()), 201

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({
                "error": "Error interno del servidor",
                "detail": str(e)
            }), 500


    @staticmethod
    def listar(req: Request) -> Response:
        try:
            activos = req.args.get("activos")
            personal = listar_personal(activos)
            return jsonify([p.serialize() for p in personal]), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    @staticmethod
    def obtener_por_id(req: Request, rol: str, id: int) -> Response:
        try:
            personal = obtener_personal_por_tipo(rol, id)

            if not personal:
                return jsonify({"error": "Personal no encontrado"}), 404

            return jsonify(personal), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404

        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    @staticmethod
    def actualizar(req: Request, rol: str, id: int) -> Response:
        data = req.get_json()

        try:
            if not hasattr(g, "current_user_id"):
                return jsonify({"error": "Usuario no autenticado"}), 401

            user_id = g.current_user_id
            personal = actualizar_personal(id, data, rol, user_id)

            return jsonify(personal.serialize()), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e :
            return jsonify({"error": str(e)}), 500


    @staticmethod
    def eliminar(req, rol, id):
        try:
            if not hasattr(g, "current_user_id"):
                return jsonify({"error": "Usuario no autenticado"}), 401

            user_id = g.current_user_id  

            result = eliminar_personal_por_rol(id, rol, user_id)

            return jsonify(result), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
