from flask import jsonify, request, g
from core.services.documentacion_service import (
    DocumentacionBibliograficaService
)

class DocumentacionBibliograficaController:

    @staticmethod
    def get_all():
        try:
            filters = {
                "activos": request.args.get("activos", "true"),
                "orden": request.args.get("orden")
            }
            return jsonify(
                DocumentacionBibliograficaService.get_all(filters)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def get_by_id(doc_id):
        try:
            return jsonify(
                DocumentacionBibliograficaService.get_by_id(doc_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404


    @staticmethod
    def create():
        try:
            data = request.get_json()
            user_id = g.current_user_id

            return jsonify(
                DocumentacionBibliograficaService.create(data, user_id)
            ), 201

        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def update(doc_id):
        try:
            data = request.get_json()

            return jsonify(
                DocumentacionBibliograficaService.update(doc_id, data)
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def delete(doc_id):
        try:
            user_id = g.current_user_id

            return jsonify(
                DocumentacionBibliograficaService.delete(doc_id, user_id)
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400


    # -------- RELACIÓN DOCUMENTO - AUTOR --------

    @staticmethod
    def add_autor(doc_id):
        try:
            data = request.get_json()

            return jsonify(
                DocumentacionBibliograficaService.add_autor(
                    doc_id,
                    data["autor_id"]
                )
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400


    @staticmethod
    def remove_autor(doc_id, autor_id):
        try:
            return jsonify(
                DocumentacionBibliograficaService.remove_autor(
                    doc_id,
                    autor_id
                )
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400
