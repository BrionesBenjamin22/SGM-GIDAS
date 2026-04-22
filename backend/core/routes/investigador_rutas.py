from flask import Blueprint, request
from core.controllers.investigador_controller import InvestigadorController
from core.services.middleware import requiere_rol

investigador_bp = Blueprint(
    "investigador",
    __name__,
    url_prefix="/investigadores"
)

# =========================
# CREAR
# =========================
@investigador_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def crear():
    return InvestigadorController.crear(request)


# =========================
# LISTAR
# =========================
@investigador_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def listar():
    return InvestigadorController.listar(request)


# =========================
# OBTENER POR ID
# =========================
@investigador_bp.route("/<int:id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def obtener(id):
    return InvestigadorController.obtener_por_id(request, id)


# =========================
# ACTUALIZAR
# =========================
@investigador_bp.route("/<int:id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def actualizar(id):
    return InvestigadorController.actualizar(request, id)


# =========================
# ELIMINAR (soft delete)
# =========================
@investigador_bp.route("/<int:id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def eliminar(id):
    return InvestigadorController.eliminar(request, id)


# =========================
# RESTORE
# =========================
@investigador_bp.route("/<int:id>/restore", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def restaurar(id):
    return InvestigadorController.restaurar(request, id)
