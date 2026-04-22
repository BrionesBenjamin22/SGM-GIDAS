from flask import Blueprint
from core.controllers.transferencia_socio_controller import (
    TransferenciaSocioProductivaController
)

from core.services.middleware import requiere_rol

transferencia_socio_productiva_bp = Blueprint(
    "transferencia_socio_productiva",
    __name__,
    url_prefix="/transferencias"
)

@transferencia_socio_productiva_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return TransferenciaSocioProductivaController.get_all()

@transferencia_socio_productiva_bp.route("/<int:transferencia_id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_by_id(transferencia_id):
    return TransferenciaSocioProductivaController.get_by_id(transferencia_id)

@transferencia_socio_productiva_bp.route("", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def create():
    return TransferenciaSocioProductivaController.create()


@transferencia_socio_productiva_bp.route("/<int:transferencia_id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def update(transferencia_id):
    return TransferenciaSocioProductivaController.update(transferencia_id)

@transferencia_socio_productiva_bp.route("/<int:transferencia_id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def delete(transferencia_id):
    return TransferenciaSocioProductivaController.delete(transferencia_id)


@transferencia_socio_productiva_bp.route("/<int:transferencia_id>/adoptantes", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def add_adoptantes(transferencia_id):
    return TransferenciaSocioProductivaController.add_adoptantes(transferencia_id)

@transferencia_socio_productiva_bp.route("/<int:transferencia_id>/adoptantes", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def remove_adoptantes(transferencia_id):
    return TransferenciaSocioProductivaController.remove_adoptantes(transferencia_id)
