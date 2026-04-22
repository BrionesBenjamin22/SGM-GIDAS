from flask import Blueprint
from core.controllers.distincion_controller import DistincionRecibidaController
from core.services.middleware import requiere_rol

distincion_recibida_bp = Blueprint(
    "distincion_recibida",
    __name__,
    url_prefix="/distinciones"
)

@distincion_recibida_bp.route("/", methods=["GET"], strict_slashes=False)
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return DistincionRecibidaController.get_all()

@distincion_recibida_bp.route(
    "/<int:distincion_id>", methods=["GET"], strict_slashes=False
)
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_by_id(distincion_id):
    return DistincionRecibidaController.get_by_id(distincion_id)

@distincion_recibida_bp.route("/", methods=["POST"], strict_slashes=False)
@requiere_rol("ADMIN", "GESTOR")
def create():
    return DistincionRecibidaController.create()

@distincion_recibida_bp.route(
    "/<int:distincion_id>", methods=["PUT"], strict_slashes=False
)
@requiere_rol("ADMIN", "GESTOR")
def update(distincion_id):
    return DistincionRecibidaController.update(distincion_id)

@distincion_recibida_bp.route(
    "/<int:distincion_id>", methods=["DELETE"], strict_slashes=False
)
@requiere_rol("ADMIN", "GESTOR")
def delete(distincion_id):
    return DistincionRecibidaController.delete(distincion_id)
