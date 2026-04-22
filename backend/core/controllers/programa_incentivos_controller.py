from flask import Request, Response, jsonify
from core.services.programa_incentivos_service import (
    crear_programa_incentivos,
    actualizar_programa_incentivos,
    eliminar_programa_incentivos,
    listar_programas_incentivos,
    obtener_programa_incentivos_por_id
)


class ProgramaIncentivosController:

    @staticmethod
    def crear(req: Request) -> Response:
        data = req.get_json()
        try:
            programa = crear_programa_incentivos(data)
            return jsonify(programa.serialize()), 201
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def listar(req: Request) -> Response:
        try:
            programas = listar_programas_incentivos()
            return jsonify([p.serialize() for p in programas]), 200
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def obtener_por_id(req: Request, id: int) -> Response:
        try:
            programa = obtener_programa_incentivos_por_id(id)
            return jsonify(programa.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def actualizar(req: Request, id: int) -> Response:
        data = req.get_json()
        try:
            programa = actualizar_programa_incentivos(id, data)
            return jsonify(programa.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def eliminar(req: Request, id: int) -> Response:
        try:
            eliminar_programa_incentivos(id)
            return jsonify(
                {"message": "Programa de incentivos eliminado correctamente"}
            ), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
