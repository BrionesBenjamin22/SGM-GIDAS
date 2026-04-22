from flask import jsonify, request, g
from core.services.actividad_docencia_service import (
    ActividadDocenciaService
)


class ActividadDocenciaController:

    @staticmethod
    def get_all():
        try:
            filtros = {
                "investigador_id": request.args.get("investigador_id", type=int),
                "orden": request.args.get("orden"),
                "activos": request.args.get("activos", "true")
            }

            return jsonify(
                ActividadDocenciaService.get_all(filtros)
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def get_by_id(actividad_id):
        try:
            return jsonify(
                ActividadDocenciaService.get_by_id(actividad_id)
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def create():
        try:
            data = request.get_json()

            return jsonify(
                ActividadDocenciaService.create(
                    data,
                    user_id=g.current_user_id
                )
            ), 201

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def update(actividad_id):
        try:
            data = request.get_json()

            return jsonify(
                ActividadDocenciaService.update(
                    actividad_id,
                    data,
                    user_id=g.current_user_id
                )
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def delete(actividad_id):
        try:
            return jsonify(
                ActividadDocenciaService.delete(
                    actividad_id,
                    user_id=g.current_user_id
                )
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400
