from flask import jsonify, request, g
from modules.grupo.services.directivo_service import DirectivoGrupoService
from modules.shared.controllers.responses import exception_response


class DirectivoController:

    # ==========================================
    # CREAR DIRECTIVO
    # ==========================================
    @staticmethod
    def create():
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            if not hasattr(g, "current_user_id"):
                return jsonify({"error": "Usuario no autenticado"}), 401

            user_id = g.current_user_id

            result = DirectivoGrupoService.crear_directivo(data, user_id)

            return jsonify(result), 201

        except Exception as error:
            return exception_response(error, operation="crear directivo")


    # ==========================================
    # GET ALL
    # ==========================================
    @staticmethod
    def get_all():
        try:
            result = DirectivoGrupoService.get_all_srv()
            return jsonify(result), 200

        except Exception as error:
            return exception_response(error, operation="listar directivos")


    # ==========================================
    # UPDATE DIRECTIVO
    # ==========================================
    @staticmethod
    def update(directivo_id):
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            if not hasattr(g, "current_user_id"):
                return jsonify({"error": "Usuario no autenticado"}), 401

            user_id = g.current_user_id

            result = DirectivoGrupoService.actualizar_directivo(
                directivo_id,
                data,
                user_id
            )

            return jsonify(result), 200

        except Exception as error:
            return exception_response(error, operation="actualizar directivo")


    # ==========================================
    # ASIGNAR DIRECTIVO A GRUPO
    # ==========================================
    @staticmethod
    def asignar():
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            if not hasattr(g, "current_user_id"):
                return jsonify({"error": "Usuario no autenticado"}), 401

            user_id = g.current_user_id

            result = DirectivoGrupoService.asignar_a_grupo(data, user_id)

            return jsonify(result), 201

        except Exception as error:
            return exception_response(error, operation="asignar directivo")


    # ==========================================
    # FINALIZAR CARGO
    # ==========================================
    @staticmethod
    def finalizar():
        try:
            data = request.get_json()

            if not data:
                return jsonify({"error": "Body requerido"}), 400

            if not hasattr(g, "current_user_id"):
                return jsonify({"error": "Usuario no autenticado"}), 401

            user_id = g.current_user_id

            result = DirectivoGrupoService.finalizar_cargo(data, user_id)

            return jsonify(result), 200

        except Exception as error:
            return exception_response(error, operation="finalizar cargo directivo")


    # ==========================================
    # OBTENER DIRECTIVOS POR GRUPO
    # ==========================================
    @staticmethod
    def get_por_grupo(grupo_id):
        try:
            result = DirectivoGrupoService.get_por_grupo(grupo_id)
            return jsonify(result), 200

        except Exception as error:
            return exception_response(error, operation="consultar directivos por grupo")


    @staticmethod
    def get_actuales(grupo_id):
        try:
            result = DirectivoGrupoService.get_actuales_por_grupo(grupo_id)
            return jsonify(result), 200

        except Exception as error:
            return exception_response(error, operation="consultar directivos actuales")
