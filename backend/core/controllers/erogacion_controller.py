from flask import jsonify, request, g
from core.services.erogacion_service import ErogacionService


class ErogacionController:

    @staticmethod
    def get_all():
        try:
            filters = request.args.to_dict()
            return jsonify(
                ErogacionService.get_all(filters)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def get_by_id(erogacion_id):
        try:
            return jsonify(
                ErogacionService.get_by_id(erogacion_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404


    @staticmethod
    def create():
        try:
            data = request.get_json()
            user_id = g.current_user_id

            return jsonify(
                ErogacionService.create(data, user_id)
            ), 201

        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def update(erogacion_id):
        try:
            data = request.get_json()
            return jsonify(
                ErogacionService.update(erogacion_id, data)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def delete(erogacion_id):
        try:
            user_id = g.current_user_id

            return jsonify(
                ErogacionService.delete(erogacion_id, user_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400