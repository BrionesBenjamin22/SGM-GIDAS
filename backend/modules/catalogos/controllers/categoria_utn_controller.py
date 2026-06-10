from flask import Request, Response, jsonify
from core.services.categoria_utn_service import (
    crear_categoria_utn,
    actualizar_categoria_utn,
    eliminar_categoria_utn,
    listar_categorias_utn,
    obtener_categoria_utn_por_id
)   


class CategoriaUtnController:

    @staticmethod
    def crear(req: Request) -> Response:
        data = req.get_json()

        try:
            categoria = crear_categoria_utn(data)
            return jsonify(categoria.serialize()), 201
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def listar(req: Request) -> Response:
        try:
            categorias = listar_categorias_utn()
            return jsonify([c.serialize() for c in categorias]), 200
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def obtener_por_id(req: Request, id: int) -> Response:
        try:
            categoria = obtener_categoria_utn_por_id(id)
            return jsonify(categoria.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def actualizar(req: Request, id: int) -> Response:
        data = req.get_json()

        try:
            categoria = actualizar_categoria_utn(id, data)
            return jsonify(categoria.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def eliminar(req: Request, id: int) -> Response:
        try:
            eliminar_categoria_utn(id)
            return jsonify({"message": "Categoría UTN eliminada correctamente"}), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
