from flask import jsonify, request, g
from core.services.becas_service import BecaService


class BecaController:

    # =========================
    # GET ALL
    # =========================
    @staticmethod
    def get_all():
        try:
            data = BecaService.get_all()
            return jsonify(data), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =========================
    # GET BY ID
    # =========================
    @staticmethod
    def get_by_id(beca_id):
        try:
            data = BecaService.get_by_id(beca_id)
            return jsonify(data), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =========================
    # CREATE
    # =========================
    @staticmethod
    def create():
        try:
            data = request.get_json()
            user_id = g.current_user_id

            nueva_beca = BecaService.create(data, user_id)

            return jsonify(nueva_beca), 201

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =========================
    # UPDATE
    # =========================
    @staticmethod
    def update(beca_id):
        try:
            data = request.get_json()

            beca_actualizada = BecaService.update(beca_id, data)

            return jsonify(beca_actualizada), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =========================
    # DELETE (SOFT DELETE)
    # =========================
    @staticmethod
    def delete(beca_id):
        try:
            user_id = g.current_user_id

            result = BecaService.delete(beca_id, user_id)
            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =========================
    # VINCULAR BECARIO
    # =========================
    @staticmethod
    def vincular_becario(beca_id):
        try:
            data = request.get_json()
            user_id = g.current_user_id

            result = BecaService.vincular_becario(beca_id, data, user_id)

            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =========================
    # DESVINCULAR BECARIO
    # =========================
    @staticmethod
    def desvincular_becario(beca_id, becario_id):
        try:
            user_id = g.current_user_id

            result = BecaService.desvincular_becario(
                beca_id,
                becario_id,
                user_id
            )

            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =========================
    # LISTAR BECARIOS DE UNA BECA
    # =========================
    @staticmethod
    def get_becarios(beca_id):
        try:
            data = BecaService.get_becarios_de_beca(beca_id)
            return jsonify(data), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =========================
    # ACTIVAS POR AÑO
    # =========================
    @staticmethod
    def get_activas():
        try:
            anio = request.args.get("anio", type=int)

            data = BecaService.get_becas_activas_en_anio(anio)

            return jsonify(data), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =========================
    # DASHBOARD
    # =========================
    @staticmethod
    def dashboard():
        try:
            anio = request.args.get("anio", type=int)

            data = BecaService.dashboard_por_anio(anio)

            return jsonify(data), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500