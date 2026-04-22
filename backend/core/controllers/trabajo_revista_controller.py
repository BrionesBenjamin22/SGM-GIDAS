from flask import jsonify, request, g
from core.services.trabajo_revista_service import (
    TrabajosRevistasReferatoService
)


class TrabajosRevistasReferatoController:

    # =================================================
    # GET ALL
    # =================================================
    @staticmethod
    def get_all():
        try:
            args = request.args
            filters = {}

            # 🔥 Filtro activos
            filters["activos"] = args.get("activos", "true")

            # -------------------------
            # Filtros válidos
            # -------------------------
            if args.get("grupo_utn_id"):
                filters["grupo_utn_id"] = int(args.get("grupo_utn_id"))

            if args.get("pais"):
                filters["pais"] = args.get("pais")

            if args.get("editorial"):
                filters["editorial"] = args.get("editorial")

            if args.get("orden") in ("asc", "desc"):
                filters["orden"] = args.get("orden")

            result = TrabajosRevistasReferatoService.get_all(filters)

            return jsonify(result), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400


    # =================================================
    # GET BY ID
    # =================================================
    @staticmethod
    def get_by_id(trabajo_id):
        try:
            result = TrabajosRevistasReferatoService.get_by_id(trabajo_id)
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

            result = TrabajosRevistasReferatoService.create(data, user_id)

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

            result = TrabajosRevistasReferatoService.update(trabajo_id, data)

            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =================================================
    # SOFT DELETE
    # =================================================
    @staticmethod
    def delete(trabajo_id):
        try:
            user_id = g.current_user_id  

            result = TrabajosRevistasReferatoService.delete(trabajo_id, user_id)

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
            result = TrabajosRevistasReferatoService.restore(trabajo_id)
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

            result = TrabajosRevistasReferatoService.vincular_investigadores(
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

            result = TrabajosRevistasReferatoService.desvincular_investigadores(
                trabajo_id,
                investigadores_ids
            )

            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500