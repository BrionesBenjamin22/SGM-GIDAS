from flask import Blueprint, request
from core.controllers.becario_controller import BecarioController
from core.services.middleware import requiere_rol

becario_bp = Blueprint(
    "becario",
    __name__,
    url_prefix="/becarios"
)

# =====================================================
# CREATE
# =====================================================
@becario_bp.route("", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def crear():
    return BecarioController.crear(request)


# =====================================================
# LISTAR
# =====================================================
@becario_bp.route("", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def listar():
    return BecarioController.listar(request)


# =====================================================
# OBTENER POR ID
# =====================================================
@becario_bp.route("/<int:id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def obtener(id):
    return BecarioController.obtener_por_id(request, id)


# =====================================================
# UPDATE
# =====================================================
@becario_bp.route("/<int:id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def actualizar(id):
    return BecarioController.actualizar(request, id)


# =====================================================
# DELETE (SOFT DELETE)
# =====================================================
@becario_bp.route("/<int:id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def eliminar(id):
    return BecarioController.eliminar(request, id)
