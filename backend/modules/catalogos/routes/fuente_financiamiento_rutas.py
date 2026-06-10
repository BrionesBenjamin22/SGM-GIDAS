from flask import Blueprint, request
from core.controllers.fuente_financiamiento_controller import FuenteFinanciamientoController
from core.services.middleware import requiere_rol

fuente_financiamiento_bp = Blueprint(
    "fuente_financiamiento",
    __name__,
    url_prefix="/fuente-financiamiento"
)

# =========================
# LECTURA
# =========================

@fuente_financiamiento_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def listar():
    return FuenteFinanciamientoController.listar(request)


@fuente_financiamiento_bp.route("/<int:id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def obtener(id):
    return FuenteFinanciamientoController.obtener_por_id(request, id)


# =========================
# MODIFICACIÓN
# =========================

@fuente_financiamiento_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def crear():
    return FuenteFinanciamientoController.crear(request)


@fuente_financiamiento_bp.route("/<int:id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def actualizar(id):
    return FuenteFinanciamientoController.actualizar(request, id)


# =========================
# ELIMINAR
# =========================

@fuente_financiamiento_bp.route("/<int:id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def eliminar(id):
    return FuenteFinanciamientoController.eliminar(request, id)
