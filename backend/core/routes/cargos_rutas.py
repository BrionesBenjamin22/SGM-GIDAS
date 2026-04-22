from flask import Blueprint
from core.controllers.cargo_controller import CargoController
from core.services.middleware import requiere_rol

cargo_bp = Blueprint("cargo", __name__, url_prefix="/cargos")

cargo_bp.route("/", methods=["GET"])(
    requiere_rol("ADMIN", "GESTOR", "LECTURA")(CargoController.get_all)
)
cargo_bp.route("/<int:cargo_id>", methods=["GET"])(
    requiere_rol("ADMIN", "GESTOR", "LECTURA")(CargoController.get_by_id)
)
cargo_bp.route("/", methods=["POST"])(
    requiere_rol("ADMIN", "GESTOR")(CargoController.create)
)
cargo_bp.route("/<int:cargo_id>", methods=["PUT"])(
    requiere_rol("ADMIN", "GESTOR")(CargoController.update)
)
cargo_bp.route("/<int:cargo_id>", methods=["DELETE"])(
    requiere_rol("ADMIN", "GESTOR")(CargoController.delete)
)
