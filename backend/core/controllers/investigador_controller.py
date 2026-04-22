from flask import Request, Response, jsonify, g
from core.services.investigador_service import (
    crear_investigador,
    actualizar_investigador,
    eliminar_investigador,
    restaurar_investigador,
    listar_investigadores,
    obtener_investigador_por_id
)


class InvestigadorController:

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

            investigador = crear_investigador(data, user_id)

            return jsonify(investigador.serialize()), 201

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
            investigadores = listar_investigadores(activos)

            return jsonify([i.serialize() for i in investigadores]), 200

        except Exception as e:
            return jsonify({
                "error": "Error interno del servidor",
                "detail": str(e)
            }), 500


    # =====================================================
    # OBTENER POR ID
    # =====================================================
    @staticmethod
    def obtener_por_id(req: Request, id: int) -> Response:
        try:
            investigador = obtener_investigador_por_id(id)

            return jsonify(investigador.serialize()), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404

        except Exception as e:
            return jsonify({
                "error": "Error interno del servidor",
                "detail": str(e)
            }), 500


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

            investigador = actualizar_investigador(id, data, user_id)

            return jsonify(investigador.serialize()), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({
                "error": "Error interno del servidor",
                "detail": str(e)
            }), 500


    # =====================================================
    # DELETE
    # =====================================================
    @staticmethod
    def eliminar(req: Request, id: int) -> Response:
        try:
            if not hasattr(g, "current_user_id"):
                return jsonify({"error": "Usuario no autenticado"}), 401

            user_id = g.current_user_id

            result = eliminar_investigador(id, user_id)

            return jsonify(result), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404

        except Exception as e:
            return jsonify({
                "error": "Error interno del servidor",
                "detail": str(e)
            }), 500


    # =====================================================
    # RESTAURAR
    # =====================================================
    @staticmethod
    def restaurar(req: Request, id: int) -> Response:
        try:
            investigador = restaurar_investigador(id)

            return jsonify(investigador.serialize()), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({
                "error": "Error interno del servidor",
                "detail": str(e)
            }), 500