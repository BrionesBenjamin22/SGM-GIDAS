from flask import jsonify, request
from core.services.grado_academico_service import GradoAcademicoService


class GradoAcademicoController:

    @staticmethod
    def get_all():
        try:
            return jsonify(GradoAcademicoService.get_all()), 200
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def get_by_id(grado_id):
        try:
            return jsonify(GradoAcademicoService.get_by_id(grado_id)), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def create():
        data = request.get_json()
        try:
            return jsonify(GradoAcademicoService.create(data)), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def update(grado_id):
        data = request.get_json()
        try:
            return jsonify(GradoAcademicoService.update(grado_id, data)), 200
        except ValueError as e:
            status = 404 if "no encontrado" in str(e).lower() else 400
            return jsonify({"error": str(e)}), status
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def delete(grado_id):
        try:
            return jsonify(GradoAcademicoService.delete(grado_id)), 200
        except ValueError as e:
            status = 404 if "no encontrado" in str(e).lower() else 400
            return jsonify({"error": str(e)}), status
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
