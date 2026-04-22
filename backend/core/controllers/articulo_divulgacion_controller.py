from flask import g, jsonify, request
from core.services.articulo_divulgacion_service import ArticuloDivulgacionService


class ArticuloDivulgacionController:

    @staticmethod
    def crear():
        try:
            data = request.get_json()
            user_id = g.current_user_id

            articulo = ArticuloDivulgacionService.create(data, user_id)
            return jsonify(articulo), 201

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def listar():
        try:
            filters = {
                "grupo_utn_id": request.args.get("grupo_utn_id", type=int),
                "orden": request.args.get("orden"),
                "activos": request.args.get("activos", "true")
            }

            articulos = ArticuloDivulgacionService.get_all(filters)
            return jsonify(articulos), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500

    @staticmethod
    def obtener_por_id(articulo_id: int):
        try:
            articulo = ArticuloDivulgacionService.get_by_id(articulo_id)
            return jsonify(articulo), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def actualizar(articulo_id: int):
        try:
            data = request.get_json()
            articulo = ArticuloDivulgacionService.update(
                articulo_id,
                data,
                user_id=g.current_user_id
            )
            return jsonify(articulo), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def eliminar(articulo_id: int):
        try:
            result = ArticuloDivulgacionService.delete(
                articulo_id,
                g.current_user_id
            )
            return jsonify(result), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400

        except Exception:
            return jsonify({"error": "Error interno del servidor"}), 500
