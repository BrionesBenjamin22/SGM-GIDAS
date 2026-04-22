from flask import request, jsonify
from core.services.cargos_service import CargoService


class CargoController:

    @staticmethod
    def get_all():
        try:
            return jsonify(CargoService.get_all()), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def get_by_id(cargo_id):
        try:
            return jsonify(CargoService.get_by_id(cargo_id)), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def create():
        try:
            data = request.get_json()
            return jsonify(CargoService.create(data)), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def update(cargo_id):
        try:
            data = request.get_json()
            return jsonify(CargoService.update(cargo_id, data)), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def delete(cargo_id):
        try:
            return jsonify(CargoService.delete(cargo_id)), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500