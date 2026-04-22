from flask import Request, Response, jsonify
from core.services.tipo_formacion_service import (
    crear_tipo_formacion,
    actualizar_tipo_formacion,
    eliminar_tipo_formacion,
    listar_tipos_formacion,
    obtener_tipo_formacion_por_id
)


class TipoFormacionController:

    @staticmethod
    def crear(req: Request) -> Response:
        data = req.get_json()
        try:
            tipo = crear_tipo_formacion(data)
            return jsonify(tipo.serialize()), 201
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def listar(req: Request) -> Response:
        try:
            tipos = listar_tipos_formacion()
            return jsonify([t.serialize() for t in tipos]), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def obtener_por_id(req: Request, id: int) -> Response:
        try:
            tipo = obtener_tipo_formacion_por_id(id)
            return jsonify(tipo.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def actualizar(req: Request, id: int) -> Response:
        data = req.get_json()
        try:
            tipo = actualizar_tipo_formacion(id, data)
            return jsonify(tipo.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def eliminar(req: Request, id: int) -> Response:
        try:
            tipo = eliminar_tipo_formacion(id)
            return jsonify(tipo.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
