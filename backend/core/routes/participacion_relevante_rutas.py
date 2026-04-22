from flask import Blueprint
from core.controllers.participacion_relevante_controller import (
    ParticipacionRelevanteController
)
from core.services.middleware import requiere_rol

participacion_relevante_bp = Blueprint(
    "participacion_relevante",
    __name__,
    url_prefix="/participaciones-relevantes"
)

@participacion_relevante_bp.route("", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return ParticipacionRelevanteController.get_all()

@participacion_relevante_bp.route("/<int:participacion_id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_by_id(participacion_id):
    return ParticipacionRelevanteController.get_by_id(participacion_id)

@participacion_relevante_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def create():
    return ParticipacionRelevanteController.create()

@participacion_relevante_bp.route("/<int:participacion_id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def update(participacion_id):
    return ParticipacionRelevanteController.update(participacion_id)

@participacion_relevante_bp.route("/<int:participacion_id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def delete(participacion_id):
    return ParticipacionRelevanteController.delete(participacion_id)
