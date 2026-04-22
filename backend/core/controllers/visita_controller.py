from flask import Request, Response, jsonify, g
from core.services.visita_service import (
    crear_visita_academica,
    actualizar_visita_academica,
    eliminar_visita_academica,
    listar_visitas,
    obtener_visita_por_id
)


class VisitaAcademicaController:

    @staticmethod
    def crear(req: Request) -> Response:
        data = req.get_json()
        try:
            visita = crear_visita_academica(data, g.current_user_id)
            return jsonify(visita.serialize()), 201
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def listar(req: Request) -> Response:
        try:
            activos = req.args.get("activos", "true")
            visitas = listar_visitas(activos)
            return jsonify([v.serialize() for v in visitas]), 200
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def obtener_por_id(req: Request, id: int) -> Response:
        try:
            visita = obtener_visita_por_id(id)
            return jsonify(visita.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def actualizar(req: Request, id: int) -> Response:
        data = req.get_json()
        try:
            visita = actualizar_visita_academica(id, data)
            return jsonify(visita.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def eliminar(req: Request, id: int) -> Response:
        try:
            eliminar_visita_academica(id, g.current_user_id)
            return jsonify(
                {"message": "Visita academica eliminada correctamente"}
            ), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
