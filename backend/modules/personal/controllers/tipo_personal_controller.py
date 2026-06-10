from flask import Request, Response, jsonify
from core.services.tipo_personal_service import (
    crear_tipo_personal,
    actualizar_tipo_personal,
    eliminar_tipo_personal,
    listar_tipos,
    obtener_tipo_por_id
)


class TipoPersonalController:

    # -------------------------
    # Crear
    # -------------------------
    @staticmethod
    def crear(req: Request) -> Response:
        data = req.get_json()

        try:
            tipo = crear_tipo_personal(data)
            return jsonify(tipo.serialize()), 201
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    # -------------------------
    # Listar todos
    # -------------------------
    @staticmethod
    def listar(req: Request) -> Response:
        try:
            tipos = listar_tipos()
            return jsonify([t.serialize() for t in tipos]), 200
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    # -------------------------
    # Obtener por ID
    # -------------------------
    @staticmethod
    def obtener_por_id(req: Request, id: int) -> Response:
        try:
            tipo = obtener_tipo_por_id(id)
            return jsonify(tipo.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    # -------------------------
    # Actualizar
    # -------------------------
    @staticmethod
    def actualizar(req: Request, id: int) -> Response:
        data = req.get_json()

        try:
            tipo = actualizar_tipo_personal(id, data)
            return jsonify(tipo.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    # -------------------------
    # Eliminar
    # -------------------------
    @staticmethod
    def eliminar(req: Request, id: int) -> Response:
        try:
            tipo = eliminar_tipo_personal(id)
            return jsonify(tipo.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

