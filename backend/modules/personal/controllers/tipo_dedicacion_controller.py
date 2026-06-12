from flask import Request, Response, jsonify, g
from modules.personal.services.tipo_dedicacion_service import (
    crear_tipo_dedicacion,
    actualizar_tipo_dedicacion,
    eliminar_tipo_dedicacion,
    listar_tipos_dedicacion,
    obtener_tipo_dedicacion_por_id
)
from modules.personal.models.personal import TipoDedicacion
from modules.shared.services.catalogo_auditoria_service import CatalogoAuditoriaService


class TipoDedicacionController:

    @staticmethod
    def crear(req: Request) -> Response:
        data = req.get_json()
        try:
            tipo = crear_tipo_dedicacion(data, getattr(g, "current_user_id", None))
            return jsonify(tipo.serialize()), 201
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def listar(req: Request) -> Response:
        try:
            tipos = listar_tipos_dedicacion(req.args.get("activos", "true"))
            return jsonify([t.serialize() for t in tipos]), 200
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def obtener_por_id(req: Request, id: int) -> Response:
        try:
            tipo = obtener_tipo_dedicacion_por_id(id)
            return jsonify(tipo.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def historial(req: Request, id: int) -> Response:
        try:
            return jsonify(
                CatalogoAuditoriaService.historial_por_modelo(TipoDedicacion, id)
            ), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def actualizar(req: Request, id: int) -> Response:
        data = req.get_json()
        try:
            tipo = actualizar_tipo_dedicacion(
                id,
                data,
                getattr(g, "current_user_id", None)
            )
            return jsonify(tipo.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def eliminar(req: Request, id: int) -> Response:
        try:
            tipo = eliminar_tipo_dedicacion(id, getattr(g, "current_user_id", None))
            return jsonify(tipo.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
