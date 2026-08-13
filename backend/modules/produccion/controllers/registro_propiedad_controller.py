from flask import g, jsonify, request

from modules.produccion.services.registro_propiedad_service import RegistrosPropiedadService
from modules.shared.controllers.responses import exception_response


class RegistrosPropiedadController:

    @staticmethod
    def get_all():
        try:
            return jsonify(RegistrosPropiedadService.get_all(request.args.get("activos", "true"))), 200
        except Exception as error:
            return exception_response(error, operation="listar registros de propiedad")

    @staticmethod
    def get_by_id(registro_id):
        try:
            return jsonify(RegistrosPropiedadService.get_by_id(registro_id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar registro de propiedad")

    @staticmethod
    def get_historial(registro_id):
        try:
            return jsonify(RegistrosPropiedadService.get_historial(registro_id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar historial de registro")

    @staticmethod
    def create():
        try:
            return jsonify(RegistrosPropiedadService.create(request.get_json(), g.current_user_id)), 201
        except Exception as error:
            return exception_response(error, operation="crear registro de propiedad")

    @staticmethod
    def update(registro_id):
        try:
            return jsonify(RegistrosPropiedadService.update(registro_id, request.get_json(), g.current_user_id)), 200
        except Exception as error:
            return exception_response(error, operation="actualizar registro de propiedad")

    @staticmethod
    def delete(registro_id):
        try:
            return jsonify(RegistrosPropiedadService.delete(registro_id, g.current_user_id)), 200
        except Exception as error:
            return exception_response(error, operation="eliminar registro de propiedad")

    @staticmethod
    def restore(registro_id):
        try:
            return jsonify(RegistrosPropiedadService.restore(registro_id)), 200
        except Exception as error:
            return exception_response(error, operation="restaurar registro de propiedad")
