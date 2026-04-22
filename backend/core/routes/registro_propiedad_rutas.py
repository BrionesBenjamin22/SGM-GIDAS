from flask import Blueprint
from core.controllers.registro_propiedad_controller import RegistrosPropiedadController
from core.services.middleware import requiere_rol

registros_propiedad_bp = Blueprint(
    "registros_propiedad",
    __name__,
    url_prefix="/registros-propiedad"
)


@registros_propiedad_bp.route("/", methods=["GET"], strict_slashes=False)
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return RegistrosPropiedadController.get_all()

@registros_propiedad_bp.route(
    "/<int:registro_id>", methods=["GET"], strict_slashes=False
)
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_by_id(registro_id):
    return RegistrosPropiedadController.get_by_id(registro_id)

@registros_propiedad_bp.route("/", methods=["POST"], strict_slashes=False)
@requiere_rol("ADMIN", "GESTOR")
def create():
    return RegistrosPropiedadController.create()

@registros_propiedad_bp.route(
    "/<int:registro_id>", methods=["PUT"], strict_slashes=False
)
@requiere_rol("ADMIN", "GESTOR")
def update(registro_id):
    return RegistrosPropiedadController.update(registro_id)

@registros_propiedad_bp.route(
    "/<int:registro_id>", methods=["DELETE"], strict_slashes=False
)
@requiere_rol("ADMIN", "GESTOR")
def delete(registro_id):
    return RegistrosPropiedadController.delete(registro_id)

@registros_propiedad_bp.route(
    "/<int:registro_id>/restore", methods=["PUT"], strict_slashes=False
)
@requiere_rol("ADMIN", "GESTOR")
def restore(registro_id):
    return RegistrosPropiedadController.restore(registro_id)
