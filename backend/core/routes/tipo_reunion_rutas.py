from flask import Blueprint
from core.controllers.tipo_reunion_controller import TipoReunionController
from core.services.middleware import requiere_rol

tipo_reunion_bp = Blueprint(
    "tipo_reunion",
    __name__,
    url_prefix="/tipos-reunion-cientifica"
)

@tipo_reunion_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return TipoReunionController.get_all()

@tipo_reunion_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def create():
    return TipoReunionController.create()

@tipo_reunion_bp.route("/<int:tipo_id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def update(tipo_id):
    return TipoReunionController.update(tipo_id)

@tipo_reunion_bp.route("/<int:tipo_id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def delete(tipo_id):
    return TipoReunionController.delete(tipo_id)
