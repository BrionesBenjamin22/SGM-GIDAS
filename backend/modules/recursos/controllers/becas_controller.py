from flask import jsonify, request, g
from modules.recursos.services.becas_service import BecaService
from modules.shared.controllers.responses import exception_response


class BecaController:

    # =========================
    # GET ALL
    # =========================
    @staticmethod
    def get_all():
        try:
            data = BecaService.get_all(request.args.get("activos", "true"))
            return jsonify(data), 200
        except Exception as error:
            return exception_response(error, operation="listar becas")


    # =========================
    # GET BY ID
    # =========================
    @staticmethod
    def get_by_id(beca_id):
        try:
            data = BecaService.get_by_id(beca_id)
            return jsonify(data), 200
        except Exception as error:
            return exception_response(error, operation="consultar beca")

    @staticmethod
    def get_historial(beca_id):
        try:
            data = BecaService.get_historial(beca_id)
            return jsonify(data), 200
        except Exception as error:
            return exception_response(error, operation="consultar historial de beca")


    # =========================
    # CREATE
    # =========================
    @staticmethod
    def create():
        try:
            data = request.get_json()
            user_id = g.current_user_id

            nueva_beca = BecaService.create(data, user_id)

            return jsonify(nueva_beca), 201

        except Exception as error:
            return exception_response(error, operation="crear beca")


    # =========================
    # UPDATE
    # =========================
    @staticmethod
    def update(beca_id):
        try:
            data = request.get_json()
            user_id = g.current_user_id

            beca_actualizada = BecaService.update(beca_id, data, user_id)

            return jsonify(beca_actualizada), 200

        except Exception as error:
            return exception_response(error, operation="actualizar beca")


    # =========================
    # DELETE (SOFT DELETE)
    # =========================
    @staticmethod
    def delete(beca_id):
        try:
            user_id = g.current_user_id

            result = BecaService.delete(beca_id, user_id)
            return jsonify(result), 200

        except Exception as error:
            return exception_response(error, operation="eliminar beca")


    # =========================
    # VINCULAR BECARIO
    # =========================
    @staticmethod
    def vincular_becario(beca_id):
        try:
            data = request.get_json()
            user_id = g.current_user_id

            result = BecaService.vincular_becario(beca_id, data, user_id)

            return jsonify(result), 200

        except Exception as error:
            return exception_response(error, operation="vincular becario")


    # =========================
    # DESVINCULAR BECARIO
    # =========================
    @staticmethod
    def desvincular_becario(beca_id, becario_id):
        try:
            user_id = g.current_user_id

            result = BecaService.desvincular_becario(
                beca_id,
                becario_id,
                user_id
            )

            return jsonify(result), 200

        except Exception as error:
            return exception_response(error, operation="desvincular becario")


    # =========================
    # LISTAR BECARIOS DE UNA BECA
    # =========================
    @staticmethod
    def get_becarios(beca_id):
        try:
            data = BecaService.get_becarios_de_beca(beca_id)
            return jsonify(data), 200

        except Exception as error:
            return exception_response(error, operation="listar becarios de beca")


    # =========================
    # ACTIVAS POR AÑO
    # =========================
    @staticmethod
    def get_activas():
        try:
            anio = request.args.get("anio", type=int)

            data = BecaService.get_becas_activas_en_anio(anio)

            return jsonify(data), 200

        except Exception as error:
            return exception_response(error, operation="listar becas activas")


    # =========================
    # DASHBOARD
    # =========================
    @staticmethod
    def dashboard():
        try:
            anio = request.args.get("anio", type=int)

            data = BecaService.dashboard_por_anio(anio)

            return jsonify(data), 200

        except Exception as error:
            return exception_response(error, operation="consultar dashboard de becas")
