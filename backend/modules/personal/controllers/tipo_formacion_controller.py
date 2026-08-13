from flask import Request, Response, jsonify, g

from modules.personal.models.personal import TipoFormacion
from modules.personal.services.tipo_formacion_service import (
    actualizar_tipo_formacion,
    crear_tipo_formacion,
    eliminar_tipo_formacion,
    listar_tipos_formacion,
    obtener_tipo_formacion_por_id,
)
from modules.shared.controllers.responses import exception_response
from modules.shared.services.catalogo_auditoria_service import CatalogoAuditoriaService


class TipoFormacionController:

    @staticmethod
    def crear(req: Request) -> Response:
        try:
            tipo = crear_tipo_formacion(req.get_json(), getattr(g, "current_user_id", None))
            return jsonify(tipo.serialize()), 201
        except Exception as error:
            return exception_response(error, operation="crear tipo de formacion")

    @staticmethod
    def listar(req: Request) -> Response:
        try:
            tipos = listar_tipos_formacion(req.args.get("activos", "true"))
            return jsonify([tipo.serialize() for tipo in tipos]), 200
        except Exception as error:
            return exception_response(error, operation="listar tipos de formacion")

    @staticmethod
    def obtener_por_id(req: Request, id: int) -> Response:
        try:
            return jsonify(obtener_tipo_formacion_por_id(id).serialize()), 200
        except Exception as error:
            return exception_response(error, operation="consultar tipo de formacion")

    @staticmethod
    def historial(req: Request, id: int) -> Response:
        try:
            return jsonify(CatalogoAuditoriaService.historial_por_modelo(TipoFormacion, id)), 200
        except Exception as error:
            return exception_response(error, operation="consultar historial de tipo de formacion")

    @staticmethod
    def actualizar(req: Request, id: int) -> Response:
        try:
            tipo = actualizar_tipo_formacion(
                id, req.get_json(), getattr(g, "current_user_id", None)
            )
            return jsonify(tipo.serialize()), 200
        except Exception as error:
            return exception_response(error, operation="actualizar tipo de formacion")

    @staticmethod
    def eliminar(req: Request, id: int) -> Response:
        try:
            tipo = eliminar_tipo_formacion(id, getattr(g, "current_user_id", None))
            return jsonify(tipo.serialize()), 200
        except Exception as error:
            return exception_response(error, operation="eliminar tipo de formacion")
