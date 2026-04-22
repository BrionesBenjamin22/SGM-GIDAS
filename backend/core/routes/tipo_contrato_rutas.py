from flask import Blueprint
from core.controllers.tipo_contrato_controller import TipoContratoController
from core.services.middleware import requiere_rol

tipo_contrato_bp = Blueprint(
    "tipo_contrato",
    __name__,
    url_prefix="/tipo-contrato"
)

tipo_contrato_bp.route("/", methods=["GET"])(
    requiere_rol("ADMIN", "GESTOR", "LECTURA")(TipoContratoController.get_all)
)

tipo_contrato_bp.route("/<int:tipo_contrato_id>", methods=["GET"])(
    requiere_rol("ADMIN", "GESTOR", "LECTURA")(TipoContratoController.get_by_id)
)

tipo_contrato_bp.route("/", methods=["POST"])(
    requiere_rol("ADMIN", "GESTOR")(TipoContratoController.create)
)

tipo_contrato_bp.route("/<int:tipo_contrato_id>", methods=["PUT"])(
    requiere_rol("ADMIN", "GESTOR")(TipoContratoController.update)
)

tipo_contrato_bp.route("/<int:tipo_contrato_id>", methods=["DELETE"])(
    requiere_rol("ADMIN", "GESTOR")(TipoContratoController.delete)
)
