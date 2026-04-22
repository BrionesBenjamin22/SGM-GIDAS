from flask import Request, Response, jsonify, g
from core.services.becario_service import (
    crear_becario,
    actualizar_becario,
    eliminar_becario,
    listar_becarios,
    obtener_becario_por_id
)


class BecarioController:

    # =====================================================
    # CREATE
    # =====================================================
    @staticmethod
    def crear(req: Request) -> Response:
        try:
            data = req.get_json()

            if not hasattr(g, "current_user_id"):
                return jsonify({"error": "Usuario no autenticado"}), 401

            user_id = g.current_user_id

            becario = crear_becario(data, user_id)
            return jsonify(becario.serialize()), 201

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({
                "error": "Error interno del servidor",
                "detail": str(e)
            }), 500


    # =====================================================
    # LISTAR
    # =====================================================
    @staticmethod
    def listar(req: Request) -> Response:
        try:
            activos = req.args.get("activos")
            becarios = listar_becarios(activos)

            return jsonify([b.serialize() for b in becarios]), 200

        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =====================================================
    # OBTENER POR ID
    # =====================================================
    @staticmethod
    def obtener_por_id(req: Request, id: int) -> Response:
        try:
            becario = obtener_becario_por_id(id)
            return jsonify(becario.serialize()), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404

        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =====================================================
    # UPDATE
    # =====================================================

    @staticmethod
    def actualizar(req: Request, id: int) -> Response:
        try:
            data = req.get_json()

            if not hasattr(g, "current_user_id"):
                return jsonify({"error": "Usuario no autenticado"}), 401

            user_id = g.current_user_id

            becario = actualizar_becario(id, data, user_id)
            return jsonify(becario.serialize()), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({
                "error": "Error interno del servidor",
                "detail": str(e)
            }), 500

    # =====================================================
    # SOFT DELETE
    # =====================================================
    @staticmethod
    def eliminar(req: Request, id: int) -> Response:
        try:
            if not hasattr(g, "current_user_id"):
                return jsonify({"error": "Usuario no autenticado"}), 401

            user_id = g.current_user_id

            result = eliminar_becario(id, user_id)

            return jsonify(result), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({
                "error": "Error interno del servidor",
                "detail": str(e)
            }), 500