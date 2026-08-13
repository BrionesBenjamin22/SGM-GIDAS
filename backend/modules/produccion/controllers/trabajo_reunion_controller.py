from flask import jsonify, request, g

from modules.produccion.services.trabajo_reunion_service import (
    TrabajoReunionCientificaService,
)
from modules.shared.controllers.responses import exception_response
from modules.shared.exceptions import ValidationError


class TrabajoReunionCientificaController:

    @staticmethod
    def get_all():
        try:
            filtros = {
                "investigador_id": request.args.get("investigador_id", type=int),
                "grupo_utn_id": request.args.get("grupo_utn_id", type=int),
                "orden": request.args.get("orden"),
                "activos": request.args.get("activos", "true"),
            }
            return jsonify(TrabajoReunionCientificaService.get_all(filtros)), 200
        except Exception as error:
            return exception_response(error, operation="listar trabajos en reuniones")

    @staticmethod
    def get_by_id(trabajo_id):
        try:
            return jsonify(TrabajoReunionCientificaService.get_by_id(trabajo_id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar trabajo en reunion")

    @staticmethod
    def get_historial(trabajo_id):
        try:
            return jsonify(TrabajoReunionCientificaService.get_historial(trabajo_id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar historial de trabajo en reunion")

    @staticmethod
    def create():
        try:
            return jsonify(TrabajoReunionCientificaService.create(
                request.get_json(), g.current_user_id
            )), 201
        except Exception as error:
            return exception_response(error, operation="crear trabajo en reunion")

    @staticmethod
    def update(trabajo_id):
        try:
            return jsonify(TrabajoReunionCientificaService.update(
                trabajo_id, request.get_json(), g.current_user_id
            )), 200
        except Exception as error:
            return exception_response(error, operation="actualizar trabajo en reunion")

    @staticmethod
    def delete(trabajo_id):
        try:
            return jsonify(TrabajoReunionCientificaService.delete(
                trabajo_id, g.current_user_id
            )), 200
        except Exception as error:
            return exception_response(error, operation="eliminar trabajo en reunion")

    @staticmethod
    def restore(trabajo_id):
        try:
            return jsonify(TrabajoReunionCientificaService.restore(trabajo_id)), 200
        except Exception as error:
            return exception_response(error, operation="restaurar trabajo en reunion")

    @staticmethod
    def _investigadores_ids():
        data = request.get_json()
        if not isinstance(data, dict):
            raise ValidationError("Body requerido")
        return data.get("investigadores_ids")

    @staticmethod
    def add_investigadores(trabajo_id):
        try:
            return jsonify(TrabajoReunionCientificaService.vincular_investigadores(
                trabajo_id,
                TrabajoReunionCientificaController._investigadores_ids(),
                g.current_user_id,
            )), 200
        except Exception as error:
            return exception_response(error, operation="vincular investigadores a trabajo en reunion")

    @staticmethod
    def remove_investigadores(trabajo_id):
        try:
            return jsonify(TrabajoReunionCientificaService.desvincular_investigadores(
                trabajo_id,
                TrabajoReunionCientificaController._investigadores_ids(),
                g.current_user_id,
            )), 200
        except Exception as error:
            return exception_response(error, operation="desvincular investigadores de trabajo en reunion")
