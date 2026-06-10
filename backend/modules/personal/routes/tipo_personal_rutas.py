from flask import Blueprint, request
from core.controllers.tipo_personal_controller import TipoPersonalController
from core.services.middleware import requiere_rol

tipo_personal_bp = Blueprint(
    "tipo_personal",
    __name__,
    url_prefix="/tipo-personal"
)

# -------------------------
# Crear tipo de personal
# -------------------------

@tipo_personal_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def crear():
    return TipoPersonalController.crear(request)


# -------------------------
# Listar todos
# -------------------------

@tipo_personal_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def listar():
    return TipoPersonalController.listar(request)


# -------------------------
# Obtener por ID
# -------------------------

@tipo_personal_bp.route("/<int:id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def obtener_por_id(id):
    return TipoPersonalController.obtener_por_id(request, id)


# -------------------------
# Actualizar
# -------------------------

@tipo_personal_bp.route("/<int:id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def actualizar(id):
    return TipoPersonalController.actualizar(request, id)


# -------------------------
# Eliminar
# -------------------------
@tipo_personal_bp.route("/<int:id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def eliminar(id):
    return TipoPersonalController.eliminar(request, id)
