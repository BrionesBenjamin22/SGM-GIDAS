from flask import jsonify, request, g
from modules.recursos.services.tipo_erogacion_service import TipoErogacionService
from modules.recursos.models.erogacion import TipoErogacion
from modules.shared.services.catalogo_auditoria_service import CatalogoAuditoriaService

class TipoErogacionController:

    @staticmethod
    def get_all():
        try:
            return jsonify(
                TipoErogacionService.get_all(request.args.get("activos", "true"))
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def get_by_id(tipo_id):
        try:
            return jsonify(
                TipoErogacionService.get_by_id(tipo_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_historial(tipo_id):
        try:
            return jsonify(
                CatalogoAuditoriaService.historial_por_modelo(TipoErogacion, tipo_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def create():
        try:
            data = request.get_json()
            return jsonify(
                TipoErogacionService.create(data, getattr(g, "current_user_id", None))
            ), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def update(tipo_id):
        try:
            data = request.get_json()
            return jsonify(
                TipoErogacionService.update(
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
                TipoErogacionService.delete(tipo_id, getattr(g, "current_user_id", None))
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
