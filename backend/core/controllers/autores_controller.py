from flask import jsonify, request
from core.services.autores_service import AutorService

class AutorController:

    @staticmethod
    def get_all():
        try:
            return jsonify(AutorService.get_all()), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def get_by_id(autor_id):
        try:
            return jsonify(
                AutorService.get_by_id(autor_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def create():
        try:
            data = request.get_json()
            return jsonify(
                AutorService.create(data)
            ), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def update(autor_id):
        try:
            data = request.get_json()
            return jsonify(
                AutorService.update(autor_id, data)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def delete(autor_id):
        try:
            return jsonify(
                AutorService.delete(autor_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    # -------- RELACIÓN AUTOR - LIBRO --------

    @staticmethod
    def add_libro(autor_id):
        try:
            data = request.get_json()
            return jsonify(
                AutorService.add_libro(
                    autor_id,
                    data["libro_id"]
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def remove_libro(autor_id, libro_id):
        try:
            return jsonify(
                AutorService.remove_libro(
                    autor_id,
                    libro_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
