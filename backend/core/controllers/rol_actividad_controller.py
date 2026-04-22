from flask import jsonify, request
from core.services.rol_actividad_service import RolActividadService


class RolActividadController:

    @staticmethod
    def get_all():
        try:
            return jsonify(RolActividadService.get_all()), 200
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def get_by_id(rol_id):
        try:
            return jsonify(RolActividadService.get_by_id(rol_id)), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def create():
        data = request.get_json()
        try:
            return jsonify(RolActividadService.create(data)), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def update(rol_id):
        data = request.get_json()
        try:
            return jsonify(RolActividadService.update(rol_id, data)), 200
        except ValueError as e:
            status = 404 if "no encontrado" in str(e).lower() else 400
            return jsonify({"error": str(e)}), status
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def delete(rol_id):
        try:
            return jsonify(RolActividadService.delete(rol_id)), 200
        except ValueError as e:
            status = 404 if "no encontrado" in str(e).lower() else 400
            return jsonify({"error": str(e)}), status
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
