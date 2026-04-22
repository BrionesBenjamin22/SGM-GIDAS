from flask import Blueprint
from core.controllers.erogacion_controller import ErogacionController
from core.services.middleware import requiere_rol

erogacion_bp = Blueprint(
    "erogacion",
    __name__,
    url_prefix="/erogaciones"
)


# LECTURA
@erogacion_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return ErogacionController.get_all()


@erogacion_bp.route("/<int:erogacion_id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_by_id(erogacion_id):
    return ErogacionController.get_by_id(erogacion_id)


# MODIFICACIÓN
@erogacion_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def create():
    return ErogacionController.create()


@erogacion_bp.route("/<int:erogacion_id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def update(erogacion_id):
    return ErogacionController.update(erogacion_id)


@erogacion_bp.route("/<int:erogacion_id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def delete(erogacion_id):
    return ErogacionController.delete(erogacion_id)
