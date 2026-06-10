from flask import jsonify, request, g
from core.services.tipo_proyecto_service import TipoProyectoService
from core.models.proyecto_investigacion import TipoProyecto
from core.services.catalogo_auditoria_service import CatalogoAuditoriaService

class TipoProyectoController:

    @staticmethod
    def get_all():
        try:
            return jsonify(
                TipoProyectoService.get_all(request.args.get("activos", "true"))
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def get_by_id(tipo_id):
        try:
            return jsonify(
                TipoProyectoService.get_by_id(tipo_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_historial(tipo_id):
        try:
            return jsonify(
                CatalogoAuditoriaService.historial_por_modelo(TipoProyecto, tipo_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404


    @staticmethod
    def create():
        try:
            data = request.get_json()
            return jsonify(
                TipoProyectoService.create(data, getattr(g, "current_user_id", None))
            ), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def update(tipo_id):
        try:
            data = request.get_json()
            return jsonify(
                TipoProyectoService.update(
                    tipo_id,
                    data,
                    getattr(g, "current_user_id", None)
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def delete(tipo_id):
        try:
            return jsonify(
                TipoProyectoService.delete(tipo_id, getattr(g, "current_user_id", None))
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
