from flask import jsonify, request, g
from modules.produccion.services.grado_academico_service import GradoAcademicoService
from modules.produccion.models.actividad_docencia import GradoAcademico
from modules.shared.services.catalogo_auditoria_service import CatalogoAuditoriaService


class GradoAcademicoController:

    @staticmethod
    def get_all():
        try:
            return jsonify(
                GradoAcademicoService.get_all(request.args.get("activos", "true"))
            ), 200
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def get_by_id(grado_id):
        try:
            return jsonify(GradoAcademicoService.get_by_id(grado_id)), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def get_historial(grado_id):
        try:
            return jsonify(
                CatalogoAuditoriaService.historial_por_modelo(
                    GradoAcademico,
                    grado_id
                )
            ), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def create():
        data = request.get_json()
        try:
            return jsonify(
                GradoAcademicoService.create(data, getattr(g, "current_user_id", None))
            ), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def update(grado_id):
        data = request.get_json()
        try:
            return jsonify(
                GradoAcademicoService.update(
                    grado_id,
                    data,
                    getattr(g, "current_user_id", None)
                )
            ), 200
        except ValueError as e:
            status = 404 if "no encontrado" in str(e).lower() else 400
            return jsonify({"error": str(e)}), status
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def delete(grado_id):
        try:
            return jsonify(
                GradoAcademicoService.delete(grado_id, getattr(g, "current_user_id", None))
            ), 200
        except ValueError as e:
            status = 404 if "no encontrado" in str(e).lower() else 400
            return jsonify({"error": str(e)}), status
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
