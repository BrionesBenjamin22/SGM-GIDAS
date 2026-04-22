from flask import jsonify, request, g
from core.services.equipamiento_service import EquipamientoService


class EquipamientoController:

    @staticmethod
    def get_all():
        try:
            activos = request.args.get("activos", "true")
            return jsonify(EquipamientoService.get_all(activos)), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def get_by_id(equipamiento_id):
        try:
            return jsonify(
                EquipamientoService.get_by_id(equipamiento_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404


    @staticmethod
    def create():
        try:
            data = request.get_json()
            user_id = g.current_user_id

            return jsonify(
                EquipamientoService.create(data, user_id)
            ), 201

        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def update(equipamiento_id):
        try:
            data = request.get_json()

            return jsonify(
                EquipamientoService.update(equipamiento_id, data)
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def delete(equipamiento_id):
        try:
            user_id = g.current_user_id

            return jsonify(
                EquipamientoService.delete(equipamiento_id, user_id)
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400
