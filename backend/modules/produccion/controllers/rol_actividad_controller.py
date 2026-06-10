from flask import jsonify, request, g
from core.services.rol_actividad_service import RolActividadService
from core.models.actividad_docencia import RolActividad
from core.services.catalogo_auditoria_service import CatalogoAuditoriaService


class RolActividadController:

    @staticmethod
    def get_all():
        try:
            return jsonify(
                RolActividadService.get_all(request.args.get("activos", "true"))
            ), 200
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def get_by_id(rol_id):
        try:
            return jsonify(RolActividadService.get_by_id(rol_id)), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def get_historial(rol_id):
        try:
            return jsonify(
                CatalogoAuditoriaService.historial_por_modelo(RolActividad, rol_id)
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
                RolActividadService.create(data, getattr(g, "current_user_id", None))
            ), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def update(rol_id):
        data = request.get_json()
        try:
            return jsonify(
                RolActividadService.update(
                    rol_id,
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
    def delete(rol_id):
        try:
            return jsonify(
                RolActividadService.delete(rol_id, getattr(g, "current_user_id", None))
            ), 200
        except ValueError as e:
            status = 404 if "no encontrado" in str(e).lower() else 400
            return jsonify({"error": str(e)}), status
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
