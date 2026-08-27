from flask import jsonify, request
from modules.produccion.services.autores_service import AutorService
from modules.shared.controllers.responses import exception_response

class AutorController:

    @staticmethod
    def get_all():
        try:
            return jsonify(AutorService.get_all()), 200
        except Exception as error:
            return exception_response(error, operation="listar autores")

    @staticmethod
    def get_by_id(autor_id):
        try:
            return jsonify(
                AutorService.get_by_id(autor_id)
            ), 200
        except Exception as error:
            return exception_response(error, operation="consultar autor")

    @staticmethod
    def create():
        try:
            data = request.get_json()
            return jsonify(
                AutorService.create(data)
            ), 201
        except Exception as error:
            return exception_response(error, operation="crear autor")

    @staticmethod
    def update(autor_id):
        try:
            data = request.get_json()
            return jsonify(
                AutorService.update(autor_id, data)
            ), 200
        except Exception as error:
            return exception_response(error, operation="actualizar autor")

    @staticmethod
    def delete(autor_id):
        try:
            return jsonify(
                AutorService.delete(autor_id)
            ), 200
        except Exception as error:
            return exception_response(error, operation="eliminar autor")

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
        except Exception as error:
            return exception_response(error, operation="asociar libro a autor")

    @staticmethod
    def remove_libro(autor_id, libro_id):
        try:
            return jsonify(
                AutorService.remove_libro(
                    autor_id,
                    libro_id
                )
            ), 200
        except Exception as error:
            return exception_response(error, operation="desasociar libro de autor")
