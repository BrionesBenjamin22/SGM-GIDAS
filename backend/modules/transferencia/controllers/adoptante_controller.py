from flask import request, jsonify, g
from core.services.adoptante_service import AdoptanteService

class AdoptanteController:
    @staticmethod
    def get_all():
        try:
            return jsonify(AdoptanteService.get_all()), 200

        except Exception as e:
            return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500

    @staticmethod
    def get_by_id(adoptante_id):
        try:
            result = AdoptanteService.get_by_id(adoptante_id)
            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 404

        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def create():
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            user_id = g.current_user_id

            result = AdoptanteService.create(data, user_id)
            return jsonify(result), 201

        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        except Exception as e:
            return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500
    
    @staticmethod
    def update(adoptante_id):
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            result = AdoptanteService.update(adoptante_id, data)
            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def delete(adoptante_id):
        try:
            if not hasattr(g, "current_user_id"):
                return jsonify({"error": "Usuario no autenticado"}), 401

            user_id = g.current_user_id

            result = AdoptanteService.delete(adoptante_id, user_id)
            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 404

        except Exception as e:
            return jsonify({
                "error": f"Error interno del servidor: {str(e)}"
            }), 500