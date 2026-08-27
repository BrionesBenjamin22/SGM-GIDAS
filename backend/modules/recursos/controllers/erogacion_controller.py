from flask import jsonify, request, g
from modules.recursos.services.erogacion_service import ErogacionService
from modules.shared.controllers.responses import exception_response


class ErogacionController:

    @staticmethod
    def get_all():
        try:
            filters = request.args.to_dict()
            return jsonify(
                ErogacionService.get_all(filters)
            ), 200
        except Exception as error:
            return exception_response(error, operation="listar erogaciones")


    @staticmethod
    def get_by_id(erogacion_id):
        try:
            return jsonify(
                ErogacionService.get_by_id(erogacion_id)
            ), 200
        except Exception as error:
            return exception_response(error, operation="consultar erogacion")

    @staticmethod
    def get_historial(erogacion_id):
        try:
            return jsonify(
                ErogacionService.get_historial(erogacion_id)
            ), 200
        except Exception as error:
            return exception_response(error, operation="consultar historial de erogacion")


    @staticmethod
    def create():
        try:
            data = request.get_json()
            user_id = g.current_user_id

            return jsonify(
                ErogacionService.create(data, user_id)
            ), 201

        except Exception as error:
            return exception_response(error, operation="crear erogacion")


    @staticmethod
    def update(erogacion_id):
        try:
            data = request.get_json()
            user_id = g.current_user_id
            return jsonify(
                ErogacionService.update(erogacion_id, data, user_id)
            ), 200
        except Exception as error:
            return exception_response(error, operation="actualizar erogacion")


    @staticmethod
    def delete(erogacion_id):
        try:
            user_id = g.current_user_id

            return jsonify(
                ErogacionService.delete(erogacion_id, user_id)
            ), 200
        except Exception as error:
            return exception_response(error, operation="eliminar erogacion")
