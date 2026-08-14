from flask import g, jsonify, request

from modules.proyectos.services.proyecto_investigacion_service import ProyectoInvestigacionService
from modules.shared.controllers.responses import exception_response
from modules.shared.exceptions import ValidationError


class ProyectoInvestigacionController:
    @staticmethod
    def get_all():
        try:
            args = request.args
            filters = {"activos": args.get("activos", "true")}
            if args.get("tipo_proyecto_id", type=int):
                filters["tipo_proyecto_id"] = args.get("tipo_proyecto_id", type=int)
            if args.get("grupo_utn_id", type=int):
                filters["grupo_utn_id"] = args.get("grupo_utn_id", type=int)
            if args.get("filtro") == "distinciones":
                filters["tiene_distinciones"] = True
            if args.get("orden") in ("asc", "monto_asc", "monto_desc"):
                filters["orden"] = args.get("orden")
            return jsonify(ProyectoInvestigacionService.get_all(filters)), 200
        except Exception as error:
            return exception_response(error, operation="listar proyectos de investigacion")

    @staticmethod
    def get_by_id(proyecto_id):
        try:
            return jsonify(ProyectoInvestigacionService.get_by_id(proyecto_id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar proyecto de investigacion")

    @staticmethod
    def get_historial(proyecto_id):
        try:
            return jsonify(ProyectoInvestigacionService.obtener_historial(proyecto_id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar historial de proyecto")

    @staticmethod
    def create():
        try:
            data = request.get_json()
            if not data:
                raise ValidationError("El body es obligatorio")
            return jsonify(ProyectoInvestigacionService.create(data, g.current_user_id)), 201
        except Exception as error:
            return exception_response(error, operation="crear proyecto de investigacion")

    @staticmethod
    def update(proyecto_id):
        try:
            data = request.get_json()
            if not data:
                raise ValidationError("El body es obligatorio")
            return jsonify(ProyectoInvestigacionService.update(proyecto_id, data, g.current_user_id)), 200
        except Exception as error:
            return exception_response(error, operation="actualizar proyecto de investigacion")

    @staticmethod
    def cerrar(proyecto_id):
        try:
            return jsonify(ProyectoInvestigacionService.cerrar_proyecto(proyecto_id, g.current_user_id)), 200
        except Exception as error:
            return exception_response(error, operation="cerrar proyecto de investigacion")

    @staticmethod
    def reabrir(proyecto_id):
        try:
            return jsonify(ProyectoInvestigacionService.reabrir_proyecto(proyecto_id)), 200
        except Exception as error:
            return exception_response(error, operation="reabrir proyecto de investigacion")

    @staticmethod
    def _participaciones():
        participaciones = request.get_json()
        if not isinstance(participaciones, list) or not participaciones:
            raise ValidationError("Debe enviarse una lista de participaciones")
        return participaciones

    @staticmethod
    def vincular_becarios(proyecto_id):
        try:
            return jsonify(ProyectoInvestigacionService.vincular_becarios_a_proyecto(proyecto_id, ProyectoInvestigacionController._participaciones())), 200
        except Exception as error:
            return exception_response(error, operation="vincular becarios a proyecto")

    @staticmethod
    def desvincular_becarios(proyecto_id):
        try:
            return jsonify(ProyectoInvestigacionService.desvincular_becarios_de_proyecto(proyecto_id, ProyectoInvestigacionController._participaciones(), g.current_user_id)), 200
        except Exception as error:
            return exception_response(error, operation="desvincular becarios de proyecto")

    @staticmethod
    def vincular_investigadores(proyecto_id):
        try:
            return jsonify(ProyectoInvestigacionService.vincular_investigadores_a_proyecto(proyecto_id, ProyectoInvestigacionController._participaciones())), 200
        except Exception as error:
            return exception_response(error, operation="vincular investigadores a proyecto")

    @staticmethod
    def desvincular_investigadores(proyecto_id):
        try:
            return jsonify(ProyectoInvestigacionService.desvincular_investigadores_de_proyecto(proyecto_id, ProyectoInvestigacionController._participaciones(), g.current_user_id)), 200
        except Exception as error:
            return exception_response(error, operation="desvincular investigadores de proyecto")
