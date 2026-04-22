from flask import jsonify, request, g
from core.services.distincion_service import DistincionRecibidaService


class DistincionRecibidaController:

    @staticmethod
    def get_all():
        try:
            filtros = {
                "proyecto_id": request.args.get("proyecto_id", type=int),
                "orden": request.args.get("orden"),
                "activos": request.args.get("activos", "true")
            }

            return jsonify(
                DistincionRecibidaService.get_all(filtros)
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def get_by_id(distincion_id):
        try:
            return jsonify(
                DistincionRecibidaService.get_by_id(distincion_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def create():
        try:
            data = request.get_json()
            user_id = g.current_user_id
            return jsonify(
                DistincionRecibidaService.create(data, user_id)
            ), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def update(distincion_id):
        try:
            data = request.get_json()
            return jsonify(
                DistincionRecibidaService.update(distincion_id, data)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def delete(distincion_id):
        try:
            user_id = g.current_user_id
            return jsonify(
                DistincionRecibidaService.delete(distincion_id, user_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
