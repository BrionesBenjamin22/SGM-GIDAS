from flask import jsonify, request
from core.services.personal_completo_service import (
    listar_personal_completo,
    obtener_personal_por_tipo
)


class PersonalCompletoController:

    @staticmethod
    def listar():
        try:
            activos = request.args.get("activos", "true")
            data = listar_personal_completo(activos)
            return jsonify(data), 200
        except Exception as e:
            print("ERROR EN PERSONAL COMPLETO:", e)
            raise

    @staticmethod
    def obtener_por_id(rol, id):
        try:
            data = obtener_personal_por_tipo(rol, id)

            if not data:
                return jsonify({"error": "No encontrado"}), 404

            return jsonify(data), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
