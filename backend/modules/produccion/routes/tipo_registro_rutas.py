from flask import Blueprint
from core.controllers.tipo_registro_controller import TipoRegistroPropiedadController
from core.services.middleware import requiere_rol

tipo_registro_propiedad_bp = Blueprint(
    "tipo_registro_propiedad",
    __name__,
    url_prefix="/tipo-registro-propiedad"
)

@tipo_registro_propiedad_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return TipoRegistroPropiedadController.get_all()

@tipo_registro_propiedad_bp.route("/<int:tipo_id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_by_id(tipo_id):
    return TipoRegistroPropiedadController.get_by_id(tipo_id)

@tipo_registro_propiedad_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def create():
    return TipoRegistroPropiedadController.create()

@tipo_registro_propiedad_bp.route("/<int:tipo_id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def update(tipo_id):
    return TipoRegistroPropiedadController.update(tipo_id)

@tipo_registro_propiedad_bp.route("/<int:tipo_id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def delete(tipo_id):
    return TipoRegistroPropiedadController.delete(tipo_id)
