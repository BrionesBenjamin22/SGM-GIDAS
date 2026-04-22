from flask import jsonify, request
from core.services.tipo_contrato_service import TipoContratoService


class TipoContratoController:

    @staticmethod
    def get_all():
        try:
            return jsonify(TipoContratoService.get_all()), 200
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def get_by_id(tipo_contrato_id):
        try:
            return jsonify(TipoContratoService.get_by_id(tipo_contrato_id)), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def create():
        try:
            data = request.get_json()
            return jsonify(TipoContratoService.create(data)), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def update(tipo_contrato_id):
        try:
            data = request.get_json()
            return jsonify(TipoContratoService.update(tipo_contrato_id, data)), 200
        except ValueError as e:
            status = 404 if "no encontrado" in str(e).lower() else 400
            return jsonify({"error": str(e)}), status
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def delete(tipo_contrato_id):
        try:
            return jsonify(TipoContratoService.delete(tipo_contrato_id)), 200
        except ValueError as e:
            status = 404 if "no encontrado" in str(e).lower() else 400
            return jsonify({"error": str(e)}), status
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
