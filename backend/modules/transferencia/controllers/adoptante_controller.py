from flask import g, jsonify, request

from modules.shared.controllers.responses import exception_response
from modules.shared.exceptions import ValidationError
from modules.transferencia.services.adoptante_service import AdoptanteService


class AdoptanteController:
    @staticmethod
    def get_all():
        try:
            return jsonify(AdoptanteService.get_all()), 200
        except Exception as error:
            return exception_response(error, operation="listar adoptantes")

    @staticmethod
    def get_by_id(adoptante_id):
        try:
            return jsonify(AdoptanteService.get_by_id(adoptante_id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar adoptante")

    @staticmethod
    def create():
        try:
            data = request.get_json()
            if not data:
                raise ValidationError("Body requerido")
            return jsonify(AdoptanteService.create(data, g.current_user_id)), 201
        except Exception as error:
            return exception_response(error, operation="crear adoptante")

    @staticmethod
    def update(adoptante_id):
        try:
            data = request.get_json()
            if not data:
                raise ValidationError("Body requerido")
            return jsonify(AdoptanteService.update(adoptante_id, data)), 200
        except Exception as error:
            return exception_response(error, operation="actualizar adoptante")

    @staticmethod
    def delete(adoptante_id):
        try:
            return jsonify(AdoptanteService.delete(adoptante_id, g.current_user_id)), 200
        except Exception as error:
            return exception_response(error, operation="eliminar adoptante")
