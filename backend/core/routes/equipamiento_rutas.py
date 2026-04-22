from flask import Blueprint
from core.controllers.equipamiento_controller import EquipamientoController
from core.services.middleware import requiere_rol

equipamiento_bp = Blueprint(
    "equipamiento",
    __name__,
    url_prefix="/equipamiento"
)


# LECTURA
@equipamiento_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return EquipamientoController.get_all()


@equipamiento_bp.route("/<int:equipamiento_id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_by_id(equipamiento_id):
    return EquipamientoController.get_by_id(equipamiento_id)


# MODIFICACIÓN
@equipamiento_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def create():
    return EquipamientoController.create()


@equipamiento_bp.route("/<int:equipamiento_id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def update(equipamiento_id):
    return EquipamientoController.update(equipamiento_id)


@equipamiento_bp.route("/<int:equipamiento_id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def delete(equipamiento_id):
    return EquipamientoController.delete(equipamiento_id)
