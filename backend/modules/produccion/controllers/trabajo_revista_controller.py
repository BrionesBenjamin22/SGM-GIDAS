from flask import jsonify, request, g

from modules.produccion.services.trabajo_revista_service import (
    TrabajosRevistasReferatoService,
)
from modules.shared.controllers.responses import exception_response
from modules.shared.exceptions import ValidationError


class TrabajosRevistasReferatoController:

    @staticmethod
    def get_all():
        try:
            args = request.args
            filters = {"activos": args.get("activos", "true")}
            if args.get("grupo_utn_id"):
                filters["grupo_utn_id"] = args.get("grupo_utn_id")
            for field in ("pais", "editorial"):
                if args.get(field):
                    filters[field] = args.get(field)
            if args.get("orden") in ("asc", "desc"):
                filters["orden"] = args.get("orden")
            return jsonify(TrabajosRevistasReferatoService.get_all(filters)), 200
        except Exception as error:
            return exception_response(error, operation="listar trabajos en revistas")

    @staticmethod
    def get_by_id(trabajo_id):
        try:
            return jsonify(TrabajosRevistasReferatoService.get_by_id(trabajo_id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar trabajo en revista")

    @staticmethod
    def get_historial(trabajo_id):
        try:
            return jsonify(TrabajosRevistasReferatoService.get_historial(trabajo_id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar historial de trabajo en revista")

    @staticmethod
    def create():
        try:
            return jsonify(TrabajosRevistasReferatoService.create(
                request.get_json(), g.current_user_id
            )), 201
        except Exception as error:
            return exception_response(error, operation="crear trabajo en revista")

    @staticmethod
    def update(trabajo_id):
        try:
            return jsonify(TrabajosRevistasReferatoService.update(
                trabajo_id, request.get_json(), g.current_user_id
            )), 200
        except Exception as error:
            return exception_response(error, operation="actualizar trabajo en revista")

    @staticmethod
    def delete(trabajo_id):
        try:
            return jsonify(TrabajosRevistasReferatoService.delete(
                trabajo_id, g.current_user_id
            )), 200
        except Exception as error:
            return exception_response(error, operation="eliminar trabajo en revista")

    @staticmethod
    def restore(trabajo_id):
        try:
            return jsonify(TrabajosRevistasReferatoService.restore(trabajo_id)), 200
        except Exception as error:
            return exception_response(error, operation="restaurar trabajo en revista")

    @staticmethod
    def _investigadores_ids():
        data = request.get_json()
        if not isinstance(data, dict):
            raise ValidationError("Body requerido")
        return data.get("investigadores_ids")

    @staticmethod
    def add_investigadores(trabajo_id):
        try:
            return jsonify(TrabajosRevistasReferatoService.vincular_investigadores(
                trabajo_id,
                TrabajosRevistasReferatoController._investigadores_ids(),
                g.current_user_id,
            )), 200
        except Exception as error:
            return exception_response(error, operation="vincular investigadores a trabajo en revista")

    @staticmethod
    def remove_investigadores(trabajo_id):
        try:
            return jsonify(TrabajosRevistasReferatoService.desvincular_investigadores(
                trabajo_id,
                TrabajosRevistasReferatoController._investigadores_ids(),
                g.current_user_id,
            )), 200
        except Exception as error:
            return exception_response(error, operation="desvincular investigadores de trabajo en revista")
