from flask import jsonify, request, g
from core.services.registro_propiedad_service import RegistrosPropiedadService


class RegistrosPropiedadController:

    # =========================
    # LISTAR
    # =========================
    @staticmethod
    def get_all():
        try:
            activos = request.args.get("activos", "true")
            registros = RegistrosPropiedadService.get_all(activos)
            return jsonify(registros), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400


    # =========================
    # OBTENER POR ID
    # =========================
    @staticmethod
    def get_by_id(registro_id):
        try:
            registro = RegistrosPropiedadService.get_by_id(registro_id)
            return jsonify(registro), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =========================
    # CREAR
    # =========================
    @staticmethod
    def create():
        try:
            data = request.get_json()

            user_id = g.current_user_id 

            registro = RegistrosPropiedadService.create(data, user_id)
            return jsonify(registro), 201

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =========================
    # ACTUALIZAR
    # =========================
    @staticmethod
    def update(registro_id):
        try:
            data = request.get_json()

            registro = RegistrosPropiedadService.update(registro_id, data)
            return jsonify(registro), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500


    # =========================
    # SOFT DELETE
    # =========================
    @staticmethod
    def delete(registro_id):
        try:
            user_id = g.current_user_id  

            resultado = RegistrosPropiedadService.delete(registro_id, user_id)
            return jsonify(resultado), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # =========================
    # RESTORE
    # =========================
    @staticmethod
    def restore(registro_id):
        try:
            registro = RegistrosPropiedadService.restore(registro_id)
            return jsonify(registro), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500