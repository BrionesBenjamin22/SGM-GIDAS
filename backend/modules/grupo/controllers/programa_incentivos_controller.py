from flask import Request, Response, jsonify, g
from modules.grupo.services.programa_incentivos_service import (
    crear_programa_incentivos,
    actualizar_programa_incentivos,
    eliminar_programa_incentivos,
    listar_programas_incentivos,
    obtener_programa_incentivos_por_id
)
from modules.grupo.models.programa_incentivos import ProgramaIncentivos
from modules.shared.services.catalogo_auditoria_service import CatalogoAuditoriaService


class ProgramaIncentivosController:

    @staticmethod
    def crear(req: Request) -> Response:
        data = req.get_json()
        try:
            programa = crear_programa_incentivos(
                data,
                getattr(g, "current_user_id", None)
            )
            return jsonify(programa.serialize()), 201
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def listar(req: Request) -> Response:
        try:
            programas = listar_programas_incentivos(req.args.get("activos", "true"))
            return jsonify([p.serialize() for p in programas]), 200
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def obtener_por_id(req: Request, id: int) -> Response:
        try:
            programa = obtener_programa_incentivos_por_id(id)
            return jsonify(programa.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def historial(req: Request, id: int) -> Response:
        try:
            return jsonify(
                CatalogoAuditoriaService.historial_por_modelo(ProgramaIncentivos, id)
            ), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def actualizar(req: Request, id: int) -> Response:
        data = req.get_json()
        try:
            programa = actualizar_programa_incentivos(
                id,
                data,
                getattr(g, "current_user_id", None)
            )
            return jsonify(programa.serialize()), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def eliminar(req: Request, id: int) -> Response:
        try:
            eliminar_programa_incentivos(id, getattr(g, "current_user_id", None))
            return jsonify(
                {"message": "Programa de incentivos eliminado correctamente"}
            ), 200
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
