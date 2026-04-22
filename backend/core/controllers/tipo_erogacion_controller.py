from flask import jsonify, request
from core.services.tipo_erogacion_service import TipoErogacionService

class TipoErogacionController:

    @staticmethod
    def get_all():
        try:
            return jsonify(TipoErogacionService.get_all()), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def get_by_id(tipo_id):
        try:
            return jsonify(
                TipoErogacionService.get_by_id(tipo_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def create():
        try:
            data = request.get_json()
            return jsonify(
                TipoErogacionService.create(data)
            ), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def update(tipo_id):
        try:
            data = request.get_json()
            return jsonify(
                TipoErogacionService.update(tipo_id, data)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def delete(tipo_id):
        try:
            return jsonify(
                TipoErogacionService.delete(tipo_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
