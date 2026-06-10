from flask import jsonify, request
from core.services.tipo_proyecto_service import TipoProyectoService

class TipoProyectoController:

    @staticmethod
    def get_all():
        try:
            return jsonify(
                TipoProyectoService.get_all()
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def get_by_id(tipo_id):
        try:
            return jsonify(
                TipoProyectoService.get_by_id(tipo_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404


    @staticmethod
    def create():
        try:
            data = request.get_json()
            return jsonify(
                TipoProyectoService.create(data)
            ), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def update(tipo_id):
        try:
            data = request.get_json()
            return jsonify(
                TipoProyectoService.update(tipo_id, data)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def delete(tipo_id):
        try:
            return jsonify(
                TipoProyectoService.delete(tipo_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
