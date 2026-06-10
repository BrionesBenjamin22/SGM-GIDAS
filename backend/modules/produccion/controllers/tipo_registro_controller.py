from flask import jsonify, request, g
from core.services.tipo_registro_service import TipoRegistroPropiedadService
from core.models.registro_patente import TipoRegistroPropiedad
from core.services.catalogo_auditoria_service import CatalogoAuditoriaService

class TipoRegistroPropiedadController:

    @staticmethod
    def get_all():
        try:
            return jsonify(
                TipoRegistroPropiedadService.get_all(request.args.get("activos", "true"))
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def get_by_id(tipo_id):
        try:
            return jsonify(TipoRegistroPropiedadService.get_by_id(tipo_id)), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_historial(tipo_id):
        try:
            return jsonify(
                CatalogoAuditoriaService.historial_por_modelo(
                    TipoRegistroPropiedad,
                    tipo_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def create():
        try:
            data = request.get_json()
            return jsonify(
                TipoRegistroPropiedadService.create(
                    data,
                    getattr(g, "current_user_id", None)
                )
            ), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def update(tipo_id):
        try:
            data = request.get_json()
            return jsonify(
                TipoRegistroPropiedadService.update(
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
                TipoRegistroPropiedadService.delete(
                    tipo_id,
                    getattr(g, "current_user_id", None)
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
