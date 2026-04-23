from flask import jsonify, request, g

from core.services.memoria_service import MemoriaService


class MemoriaController:

    @staticmethod
    def get_all():
        try:
            activos = request.args.get("activos", "true")
            return jsonify(MemoriaService.get_all(activos)), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def get_by_id(memoria_id):
        try:
            return jsonify(
                MemoriaService.get_by_id(memoria_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_investigadores_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_investigadores_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_becarios_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_becarios_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_personal_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_personal_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_proyectos_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_proyectos_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def create():
        try:
            data = request.get_json()
            user_id = g.current_user_id

            return jsonify(
                MemoriaService.create(data, user_id)
            ), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def update(memoria_id):
        try:
            data = request.get_json()

            return jsonify(
                MemoriaService.update(memoria_id, data)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def delete(memoria_id):
        try:
            user_id = g.current_user_id

            return jsonify(
                MemoriaService.delete(memoria_id, user_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def change_status(memoria_id):
        try:
            data = request.get_json()
            user_id = g.current_user_id

            return jsonify(
                MemoriaService.change_status(memoria_id, data, user_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def reopen(memoria_id):
        try:
            data = request.get_json(silent=True) or {}
            user_id = g.current_user_id

            return jsonify(
                MemoriaService.reopen(memoria_id, user_id, data)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
