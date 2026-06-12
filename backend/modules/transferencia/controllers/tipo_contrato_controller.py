from flask import jsonify, request, g
from modules.transferencia.services.tipo_contrato_service import TipoContratoService
from modules.transferencia.models.transferencia_socio import TipoContrato
from modules.shared.services.catalogo_auditoria_service import CatalogoAuditoriaService


class TipoContratoController:

    @staticmethod
    def get_all():
        try:
            return jsonify(
                TipoContratoService.get_all(request.args.get("activos", "true"))
            ), 200
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
    def get_historial(tipo_contrato_id):
        try:
            return jsonify(
                CatalogoAuditoriaService.historial_por_modelo(
                    TipoContrato,
                    tipo_contrato_id
                )
            ), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def create():
        try:
            data = request.get_json()
            return jsonify(
                TipoContratoService.create(data, getattr(g, "current_user_id", None))
            ), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def update(tipo_contrato_id):
        try:
            data = request.get_json()
            return jsonify(
                TipoContratoService.update(
                    tipo_contrato_id,
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
    def delete(tipo_contrato_id):
        try:
            return jsonify(
                TipoContratoService.delete(
                    tipo_contrato_id,
                    getattr(g, "current_user_id", None)
                )
            ), 200
        except ValueError as e:
            status = 404 if "no encontrado" in str(e).lower() else 400
            return jsonify({"error": str(e)}), status
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
