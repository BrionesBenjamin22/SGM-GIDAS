from flask import Blueprint
from core.controllers.tipo_erogacion_controller import TipoErogacionController
from core.services.middleware import requiere_rol

tipo_erogacion_bp = Blueprint(
    "tipo_erogacion",
    __name__,
    url_prefix="/tipo-erogacion"
)

tipo_erogacion_bp.route("/", methods=["GET"])(
    requiere_rol("ADMIN", "GESTOR", "LECTURA")(TipoErogacionController.get_all)
)

tipo_erogacion_bp.route("/<int:tipo_id>", methods=["GET"])(
    requiere_rol("ADMIN", "GESTOR", "LECTURA")(TipoErogacionController.get_by_id)
)

tipo_erogacion_bp.route("/", methods=["POST"])(
    requiere_rol("ADMIN", "GESTOR")(TipoErogacionController.create)
)

tipo_erogacion_bp.route("/<int:tipo_id>", methods=["PUT"])(
    requiere_rol("ADMIN", "GESTOR")(TipoErogacionController.update)
)

tipo_erogacion_bp.route("/<int:tipo_id>", methods=["DELETE"])(
    requiere_rol("ADMIN", "GESTOR")(TipoErogacionController.delete)
)
