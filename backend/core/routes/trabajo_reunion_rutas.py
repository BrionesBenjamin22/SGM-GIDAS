from flask import Blueprint
from core.controllers.trabajo_reunion_controller import (
    TrabajoReunionCientificaController
)
from core.services.middleware import requiere_rol

trabajo_reunion_cientifica_bp = Blueprint(
    "trabajo_reunion_cientifica",
    __name__,
    url_prefix="/trabajos-reunion-cientifica"
)

@trabajo_reunion_cientifica_bp.route("/", methods=["GET"], strict_slashes=False)
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return TrabajoReunionCientificaController.get_all()

@trabajo_reunion_cientifica_bp.route(
    "/<int:trabajo_id>", methods=["GET"], strict_slashes=False
)
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_by_id(trabajo_id):
    return TrabajoReunionCientificaController.get_by_id(trabajo_id)

@trabajo_reunion_cientifica_bp.route("/", methods=["POST"], strict_slashes=False)
@requiere_rol("ADMIN", "GESTOR")
def create():
    return TrabajoReunionCientificaController.create()

@trabajo_reunion_cientifica_bp.route(
    "/<int:trabajo_id>", methods=["PUT"], strict_slashes=False
)
@requiere_rol("ADMIN", "GESTOR")
def update(trabajo_id):
    return TrabajoReunionCientificaController.update(trabajo_id)

@trabajo_reunion_cientifica_bp.route(
    "/<int:trabajo_id>", methods=["DELETE"], strict_slashes=False
)
@requiere_rol("ADMIN", "GESTOR")
def delete(trabajo_id):
    return TrabajoReunionCientificaController.delete(trabajo_id)

@trabajo_reunion_cientifica_bp.route(
    "/<int:trabajo_id>/investigadores/", methods=["POST"], strict_slashes=False
)
@requiere_rol("ADMIN", "GESTOR")
def add_investigadores(trabajo_id):
    return TrabajoReunionCientificaController.add_investigadores(trabajo_id)

@trabajo_reunion_cientifica_bp.route(
    "/<int:trabajo_id>/investigadores/", methods=["DELETE"], strict_slashes=False
)
@requiere_rol("ADMIN", "GESTOR")
def remove_investigadores(trabajo_id):
    return TrabajoReunionCientificaController.remove_investigadores(trabajo_id)

@trabajo_reunion_cientifica_bp.route(
    "/<int:trabajo_id>/restore", methods=["PUT"], strict_slashes=False
)
@requiere_rol("ADMIN", "GESTOR")
def restore(trabajo_id):
    return TrabajoReunionCientificaController.restore(trabajo_id)
