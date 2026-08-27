from flask import request, jsonify, g
from modules.grupo.services.cargos_service import CargoService
from modules.grupo.models.directivos import Cargo
from modules.shared.controllers.pagination import (
    pagination_requested,
    parse_pagination_params,
)
from modules.shared.controllers.responses import exception_response, paginated_response
from modules.shared.services.catalogo_auditoria_service import CatalogoAuditoriaService


class CargoController:

    @staticmethod
    def get_all():
        try:
            if pagination_requested(request.args):
                params = parse_pagination_params(request.args)
                cargos, total = CargoService.get_page(**params)
                return paginated_response(
                    cargos,
                    page=params["page"],
                    per_page=params["per_page"],
                    total=total,
                    meta={
                        "activos": params["activos"],
                        "orden": params["orden"],
                    },
                )

            return jsonify(CargoService.get_all(request.args.get("activos", "true"))), 200
        except Exception as error:
            return exception_response(error, operation="listar cargos")

    @staticmethod
    def get_by_id(cargo_id):
        try:
            return jsonify(CargoService.get_by_id(cargo_id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar historial de cargo")

    @staticmethod
    def get_historial(cargo_id):
        try:
            return jsonify(
                CatalogoAuditoriaService.historial_por_modelo(Cargo, cargo_id)
            ), 200
        except Exception as error:
            return exception_response(error, operation="consultar cargo")

    @staticmethod
    def create():
        try:
            data = request.get_json()
            return jsonify(
                CargoService.create(data, getattr(g, "current_user_id", None))
            ), 201
        except Exception as error:
            return exception_response(error, operation="crear cargo")

    @staticmethod
    def update(cargo_id):
        try:
            data = request.get_json()
            return jsonify(
                CargoService.update(cargo_id, data, getattr(g, "current_user_id", None))
            ), 200
        except Exception as error:
            return exception_response(error, operation="actualizar cargo")

    @staticmethod
    def delete(cargo_id):
        try:
            return jsonify(
                CargoService.delete(cargo_id, getattr(g, "current_user_id", None))
            ), 200
        except Exception as error:
            return exception_response(error, operation="eliminar cargo")
