from flask import jsonify, request
from modules.personal.services.personal_completo_service import (
    listar_personal_completo,
    obtener_personal_por_tipo
)
from modules.shared.services.logging_config import get_logger


logger = get_logger(__name__)


class PersonalCompletoController:

    @staticmethod
    def listar():
        try:
            activos = request.args.get("activos", "true")
            tipo = request.args.get("tipo")
            data = listar_personal_completo(activos, tipo)
            return jsonify(data), 200
        except Exception as e:
            logger.exception("Error al listar personal completo")
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
