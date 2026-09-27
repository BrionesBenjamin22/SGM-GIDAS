from flask import g, jsonify, request

from modules.recursos.models.movimiento_financiero import CategoriaErogacion
from modules.recursos.services.movimiento_financiero_service import MovimientoFinancieroService
from modules.recursos.services.saldo_financiero_service import SaldoFinancieroService
from modules.shared.controllers.responses import exception_response


class MovimientoFinancieroController:
    @staticmethod
    def get_all():
        try:
            return jsonify(MovimientoFinancieroService.get_all(request.args.to_dict())), 200
        except Exception as error:
            return exception_response(error, operation="listar movimientos financieros")

    @staticmethod
    def get_by_id(movimiento_id):
        try:
            return jsonify(MovimientoFinancieroService.get_by_id(movimiento_id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar movimiento financiero")

    @staticmethod
    def get_historial(movimiento_id):
        try:
            return jsonify(MovimientoFinancieroService.get_historial(movimiento_id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar historial financiero")

    @staticmethod
    def get_resumen(grupo_id):
        try:
            return jsonify(SaldoFinancieroService.calcular(grupo_id).serialize()), 200
        except Exception as error:
            return exception_response(error, operation="consultar saldo financiero")

    @staticmethod
    def get_categorias():
        try:
            categorias = CategoriaErogacion.query.filter(
                CategoriaErogacion.deleted_at.is_(None)
            ).order_by(CategoriaErogacion.nombre.asc()).all()
            return jsonify([categoria.serialize() for categoria in categorias]), 200
        except Exception as error:
            return exception_response(error, operation="listar categorías de erogación")

    @staticmethod
    def create():
        try:
            return jsonify(MovimientoFinancieroService.create(
                request.get_json(), g.current_user_id,
            )), 201
        except Exception as error:
            return exception_response(error, operation="crear movimiento financiero")

    @staticmethod
    def update(movimiento_id):
        try:
            return jsonify(MovimientoFinancieroService.update(
                movimiento_id, request.get_json(), g.current_user_id,
            )), 200
        except Exception as error:
            return exception_response(error, operation="actualizar movimiento financiero")

    @staticmethod
    def delete(movimiento_id):
        try:
            return jsonify(MovimientoFinancieroService.delete(
                movimiento_id, g.current_user_id,
            )), 200
        except Exception as error:
            return exception_response(error, operation="eliminar movimiento financiero")
