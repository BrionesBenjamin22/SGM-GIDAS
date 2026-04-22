from flask import jsonify, request, g
from core.services.transferencia_service import (
    TransferenciaSocioProductivaService
)


class TransferenciaSocioProductivaController:

    # =================================================
    # GET ALL
    # =================================================
    @staticmethod
    def get_all():
        try:
            filtros = {
                "grupo_utn_id": request.args.get("grupo_utn_id", type=int),
                "tipo_contrato_id": request.args.get("tipo_contrato_id", type=int),
                "activos": request.args.get("activos", "true")
            }

            result = TransferenciaSocioProductivaService.get_all(filtros)

            return jsonify(result), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400


    # =================================================
    # GET BY ID
    # =================================================
    @staticmethod
    def get_by_id(transferencia_id):
        try:
            result = TransferenciaSocioProductivaService.get_by_id(transferencia_id)
            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =================================================
    # CREATE
    # =================================================
    @staticmethod
    def create():
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            user_id = g.current_user_id

            result = TransferenciaSocioProductivaService.create(
                data,
                user_id
            )

            return jsonify(result), 201

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =================================================
    # UPDATE
    # =================================================
    @staticmethod
    def update(transferencia_id):
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            result = TransferenciaSocioProductivaService.update(
                transferencia_id,
                data
            )

            return jsonify(result), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =================================================
    # SOFT DELETE
    # =================================================
    @staticmethod
    def delete(transferencia_id):
        try:
            user_id = g.current_user_id  

            result = TransferenciaSocioProductivaService.delete(
                transferencia_id,
                user_id
            )

            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =================================================
    # RESTORE
    # =================================================
    @staticmethod
    def restore(transferencia_id):
        try:
            result = TransferenciaSocioProductivaService.restore(
                transferencia_id
            )

            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =================================================
    # VINCULAR ADOPTANTES
    # =================================================
    @staticmethod
    def add_adoptantes(transferencia_id):
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            adoptantes_ids = data.get("adoptantes_ids")

            if not isinstance(adoptantes_ids, list) or not adoptantes_ids:
                return jsonify({
                    "error": "adoptantes_ids debe ser una lista no vacía"
                }), 400

            user_id = g.current_user_id

            result = TransferenciaSocioProductivaService.add_adoptantes(
                transferencia_id,
                adoptantes_ids,
                user_id
            )

            return jsonify(result), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =================================================
    # DESVINCULAR ADOPTANTES
    # =================================================
    @staticmethod
    def remove_adoptantes(transferencia_id):
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            adoptantes_ids = data.get("adoptantes_ids")

            if not isinstance(adoptantes_ids, list) or not adoptantes_ids:
                return jsonify({
                    "error": "adoptantes_ids debe ser una lista no vacía"
                }), 400

            user_id = g.current_user_id

            result = TransferenciaSocioProductivaService.remove_adoptantes(
                transferencia_id,
                adoptantes_ids,
                user_id
            )

            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500