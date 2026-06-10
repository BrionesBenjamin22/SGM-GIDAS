from flask import Request, Response, jsonify, g
from core.services.fuente_financiamiento_service import (
    crear_fuente_financiamiento,
    actualizar_fuente_financiamiento,
    eliminar_fuente_financiamiento,
    listar_fuentes_financiamiento,
    obtener_fuente_financiamiento_por_id
)
from core.models.fuente_financiamiento import FuenteFinanciamiento
from core.services.catalogo_auditoria_service import CatalogoAuditoriaService


class FuenteFinanciamientoController:

    @staticmethod
    def crear(req: Request) -> Response:
        data = req.get_json()
        try:
            fuente = crear_fuente_financiamiento(
                data,
                getattr(g, "current_user_id", None)
            )
            return jsonify(fuente.serialize()), 201
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def listar(req: Request) -> Response:
        try:
            fuentes = listar_fuentes_financiamiento(req.args.get("activos", "true"))
            return jsonify([f.serialize() for f in fuentes]), 200
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def obtener_por_id(req: Request, id: int) -> Response:
        try:
            fuente = obtener_fuente_financiamiento_por_id(id)
            return jsonify(fuente.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def historial(req: Request, id: int) -> Response:
        try:
            return jsonify(
                CatalogoAuditoriaService.historial_por_modelo(FuenteFinanciamiento, id)
            ), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def actualizar(req: Request, id: int) -> Response:
        data = req.get_json()
        try:
            fuente = actualizar_fuente_financiamiento(
                id,
                data,
                getattr(g, "current_user_id", None)
            )
            return jsonify(fuente.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def eliminar(req: Request, id: int) -> Response:
        try:
            fuente = eliminar_fuente_financiamiento(
                id,
                getattr(g, "current_user_id", None)
            )
            return jsonify(fuente.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
