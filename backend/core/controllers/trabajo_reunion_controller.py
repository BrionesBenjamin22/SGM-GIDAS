from flask import jsonify, request, g
from core.services.trabajo_reunion_service import (
    TrabajoReunionCientificaService
)


class TrabajoReunionCientificaController:

    # =================================================
    # GET ALL
    # =================================================
    @staticmethod
    def get_all():
        try:
            filtros = {
                "investigador_id": request.args.get("investigador_id", type=int),
                "grupo_utn_id": request.args.get("grupo_utn_id", type=int),
                "orden": request.args.get("orden"),
                "activos": request.args.get("activos", "true")
            }

            result = TrabajoReunionCientificaService.get_all(filtros)

            return jsonify(result), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400


    # =================================================
    # GET BY ID
    # =================================================
    @staticmethod
    def get_by_id(trabajo_id):
        try:
            result = TrabajoReunionCientificaService.get_by_id(trabajo_id)
            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =================================================
    # CREATE (con auditoría)
    # =================================================
    @staticmethod
    def create():
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            user_id = g.current_user_id  

            result = TrabajoReunionCientificaService.create(data, user_id)

            return jsonify(result), 201

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =================================================
    # UPDATE
    # =================================================
    @staticmethod
    def update(trabajo_id):
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            result = TrabajoReunionCientificaService.update(trabajo_id, data)

            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =================================================
    # SOFT DELETE (con auditoría)
    # =================================================
    @staticmethod
    def delete(trabajo_id):
        try:
            user_id = g.current_user_id  

            result = TrabajoReunionCientificaService.delete(trabajo_id, user_id)

            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =================================================
    # RESTORE
    # =================================================
    @staticmethod
    def restore(trabajo_id):
        try:
            result = TrabajoReunionCientificaService.restore(trabajo_id)
            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =================================================
    # VINCULAR INVESTIGADORES
    # =================================================
    @staticmethod
    def add_investigadores(trabajo_id):
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            investigadores_ids = data.get("investigadores_ids")

            if not isinstance(investigadores_ids, list) or not investigadores_ids:
                return jsonify({
                    "error": "investigadores_ids debe ser una lista no vacía"
                }), 400

            result = TrabajoReunionCientificaService.vincular_investigadores(
                trabajo_id,
                investigadores_ids
            )

            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =================================================
    # DESVINCULAR INVESTIGADORES
    # =================================================
    @staticmethod
    def remove_investigadores(trabajo_id):
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            investigadores_ids = data.get("investigadores_ids")

            if not isinstance(investigadores_ids, list) or not investigadores_ids:
                return jsonify({
                    "error": "investigadores_ids debe ser una lista no vacía"
                }), 400

            result = TrabajoReunionCientificaService.desvincular_investigadores(
                trabajo_id,
                investigadores_ids
            )

            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500