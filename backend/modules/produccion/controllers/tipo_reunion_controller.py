from flask import jsonify, request, g
from core.models.trabajo_reunion import TipoReunion
from core.services.catalogo_auditoria_service import CatalogoAuditoriaService
from extension import db


class TipoReunionController:

    @staticmethod
    def get_all():
        activos = request.args.get("activos", "true")
        query = TipoReunion.query
        if activos == "true":
            query = query.filter(TipoReunion.deleted_at.is_(None))
        elif activos == "false":
            query = query.filter(TipoReunion.deleted_at.isnot(None))
        tipos = query.order_by(TipoReunion.nombre.asc()).all()
        return jsonify([t.serialize() for t in tipos]), 200

    @staticmethod
    def get_historial(tipo_id):
        try:
            return jsonify(
                CatalogoAuditoriaService.historial_por_modelo(TipoReunion, tipo_id)
            ), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def create():
        data = request.get_json()
        try:
            tipo = TipoReunion(nombre=data["nombre"])
            CatalogoAuditoriaService.marcar_creacion(
                tipo,
                getattr(g, "current_user_id", None)
            )
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
            nombre = data.get("nombre", tipo.nombre)
            cambios = CatalogoAuditoriaService.construir_cambios(
                tipo,
                {"nombre": nombre}
            )
            tipo.nombre = nombre
            CatalogoAuditoriaService.marcar_actualizacion(
                tipo,
                cambios,
                getattr(g, "current_user_id", None)
            )
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
            CatalogoAuditoriaService.marcar_baja(
                tipo,
                getattr(g, "current_user_id", None)
            )
            db.session.commit()
            return jsonify({"message": "Eliminado correctamente"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400
