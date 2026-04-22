from flask import jsonify, request, g
from core.services.proyecto_investigacion_service import ProyectoInvestigacionService


class ProyectoInvestigacionController:

    # =========================
    # GET ALL
    # =========================
    @staticmethod
    def get_all():
        try:
            args = request.args
            filters = {}

            filters["activos"] = args.get("activos", "true")

            if args.get("tipo_proyecto_id", type=int):
                filters["tipo_proyecto_id"] = args.get("tipo_proyecto_id", type=int)

            if args.get("grupo_utn_id", type=int):
                filters["grupo_utn_id"] = args.get("grupo_utn_id", type=int)

            if args.get("filtro") == "distinciones":
                filters["tiene_distinciones"] = True

            if args.get("orden") in ("asc", "monto_asc", "monto_desc"):
                filters["orden"] = args.get("orden")

            return jsonify(
                ProyectoInvestigacionService.get_all(filters)
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    # =========================
    # GET BY ID
    # =========================
    @staticmethod
    def get_by_id(proyecto_id):
        try:
            return jsonify(
                ProyectoInvestigacionService.get_by_id(proyecto_id)
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 404

    # =========================
    # CREATE
    # =========================
    @staticmethod
    def create():
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "El body es obligatorio"}), 400

            user = g.current_user_id
            
            return jsonify(
                ProyectoInvestigacionService.create(data, user)
            ), 201

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    # =========================
    # UPDATE
    # =========================
    @staticmethod
    def update(proyecto_id):
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "El body es obligatorio"}), 400

            user_id = g.current_user_id

            return jsonify(
                ProyectoInvestigacionService.update(proyecto_id, data, user_id)
            ), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    # =========================
    # CERRAR PROYECTO
    # =========================
    @staticmethod
    def cerrar(proyecto_id):
        try:
            user_id = g.current_user_id
            return jsonify(
                ProyectoInvestigacionService.cerrar_proyecto(proyecto_id, user_id)
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    # =========================
    # REABRIR PROYECTO
    # =========================
    @staticmethod
    def reabrir(proyecto_id):
        try:
            return jsonify(
                ProyectoInvestigacionService.reabrir_proyecto(proyecto_id)
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    # =====================================================
    # VINCULAR / DESVINCULAR BECARIOS
    # =====================================================

    @staticmethod
    def vincular_becarios(proyecto_id):
        try:
            participaciones = request.get_json()

            if not participaciones or not isinstance(participaciones, list):
                return jsonify({"error": "Debe enviarse una lista de participaciones"}), 400

            return jsonify(
                ProyectoInvestigacionService.vincular_becarios_a_proyecto(
                    proyecto_id,
                    participaciones
                )
            ), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def desvincular_becarios(proyecto_id):
        try:
            participaciones = request.get_json()

            if not participaciones or not isinstance(participaciones, list):
                return jsonify({"error": "Debe enviarse una lista de participaciones"}), 400
            
            user_id = g.current_user_id
            
            return jsonify(
                ProyectoInvestigacionService.desvincular_becarios_de_proyecto(
                    proyecto_id,
                    participaciones,
                    user_id
                )
            ), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    # =====================================================
    # VINCULAR / DESVINCULAR INVESTIGADORES
    # =====================================================

    @staticmethod
    def vincular_investigadores(proyecto_id):
        try:
            participaciones = request.get_json()

            if not participaciones or not isinstance(participaciones, list):
                return jsonify({"error": "Debe enviarse una lista de participaciones"}), 400

            return jsonify(
                ProyectoInvestigacionService.vincular_investigadores_a_proyecto(
                    proyecto_id,
                    participaciones
                )
            ), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def desvincular_investigadores(proyecto_id):
        try:
            participaciones = request.get_json()

            if not participaciones or not isinstance(participaciones, list):
                return jsonify({"error": "Debe enviarse una lista de participaciones"}), 400

            user_id = g.current_user_id
            return jsonify(
                ProyectoInvestigacionService.desvincular_investigadores_de_proyecto(
                    proyecto_id,
                    participaciones,
                    user_id
                )
            ), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({"error": str(e)}), 400
