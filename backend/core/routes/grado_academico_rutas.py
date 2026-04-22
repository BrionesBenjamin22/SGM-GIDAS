from core.controllers.grado_academico_controller import GradoAcademicoController
from core.services.middleware import requiere_rol
from flask import Blueprint

grado_academico_bp = Blueprint(
    "grado_academico",
    __name__,
    url_prefix="/grado-academico"
)

# =========================
# LECTURA
# =========================

@grado_academico_bp.route("", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return GradoAcademicoController.get_all()


@grado_academico_bp.route("/<int:grado_id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_by_id(grado_id):
    return GradoAcademicoController.get_by_id(grado_id)


# =========================
# MODIFICACIÓN
# =========================

@grado_academico_bp.route("", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def create():
    return GradoAcademicoController.create()


@grado_academico_bp.route("/<int:grado_id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def update(grado_id):
    return GradoAcademicoController.update(grado_id)


# =========================
# ELIMINAR
# =========================

@grado_academico_bp.route("/<int:grado_id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def delete(grado_id):
    return GradoAcademicoController.delete(grado_id)
