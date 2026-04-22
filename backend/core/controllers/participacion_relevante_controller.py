from flask import jsonify, request, g
from core.services.participacion_relevante_service import (
    ParticipacionRelevanteService
)


class ParticipacionRelevanteController:

    @staticmethod
    def get_all():
        try:
            filters = request.args.to_dict()
            return jsonify(
                ParticipacionRelevanteService.get_all(filters)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def get_by_id(participacion_id):
        try:
            return jsonify(
                ParticipacionRelevanteService.get_by_id(participacion_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def create():
        try:
            data = request.get_json()
            user_id = g.current_user_id
            return jsonify(
                ParticipacionRelevanteService.create(data, user_id)
            ), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def update(participacion_id):
        try:
            data = request.get_json()
            return jsonify(
                ParticipacionRelevanteService.update(participacion_id, data)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def delete(participacion_id):
        try:
            user_id = g.current_user_id
            return jsonify(
                ParticipacionRelevanteService.delete(participacion_id, user_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
