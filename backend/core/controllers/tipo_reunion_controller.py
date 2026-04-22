from flask import jsonify, request
from core.models.trabajo_reunion import TipoReunion
from extension import db


class TipoReunionController:

    @staticmethod
    def get_all():
        tipos = TipoReunion.query.order_by(TipoReunion.nombre.asc()).all()
        return jsonify([t.serialize() for t in tipos]), 200

    @staticmethod
    def create():
        data = request.get_json()
        try:
            tipo = TipoReunion(nombre=data["nombre"])
            db.session.add(tipo)
            db.session.commit()
            return jsonify(tipo.serialize()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def update(tipo_id):
        data = request.get_json()
        try:
            tipo = TipoReunion.query.get(tipo_id)
            if not tipo:
                return jsonify({"error": "Tipo de reunión no encontrado"}), 404
            tipo.nombre = data.get("nombre", tipo.nombre)
            db.session.commit()
            return jsonify(tipo.serialize()), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def delete(tipo_id):
        try:
            tipo = TipoReunion.query.get(tipo_id)
            if not tipo:
                return jsonify({"error": "Tipo de reunión no encontrado"}), 404
            db.session.delete(tipo)
            db.session.commit()
            return jsonify({"message": "Eliminado correctamente"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400
