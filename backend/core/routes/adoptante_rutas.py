from flask import Blueprint
from core.controllers.adoptante_controller import AdoptanteController
from core.services.middleware import requiere_rol

adoptante_bp = Blueprint(
    "adoptante",
    __name__,
    url_prefix="/adoptantes"
)

# -------------------------
# GET (puede ser público o lectura)
# -------------------------
adoptante_bp.route("", methods=["GET"])(
    requiere_rol("ADMIN", "GESTOR", "LECTURA")(AdoptanteController.get_all)
)

adoptante_bp.route("/<int:adoptante_id>", methods=["GET"])(
    requiere_rol("ADMIN", "GESTOR", "LECTURA")(AdoptanteController.get_by_id)
)

# -------------------------
# CREATE
# -------------------------
adoptante_bp.route("", methods=["POST"])(
    requiere_rol("ADMIN", "GESTOR")(AdoptanteController.create)
)

# -------------------------
# UPDATE
# -------------------------
adoptante_bp.route("/<int:adoptante_id>", methods=["PUT"])(
    requiere_rol("ADMIN", "GESTOR")(AdoptanteController.update)
)

# -------------------------
# DELETE
# -------------------------
adoptante_bp.route("/<int:adoptante_id>", methods=["DELETE"])(
    requiere_rol("ADMIN", "GESTOR")(AdoptanteController.delete)
)
