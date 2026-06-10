from flask import Blueprint, request
from core.controllers.tipo_dedicacion_controller import TipoDedicacionController
from core.services.middleware import requiere_rol

tipo_dedicacion_bp = Blueprint(
    "tipo_dedicacion",
    __name__,
    url_prefix="/tipo-dedicacion"
)

@tipo_dedicacion_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def crear():
    return TipoDedicacionController.crear(request)

@tipo_dedicacion_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def listar():
    return TipoDedicacionController.listar(request)

@tipo_dedicacion_bp.route("/<int:id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def obtener(id):
    return TipoDedicacionController.obtener_por_id(request, id)

@tipo_dedicacion_bp.route("/<int:id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def actualizar(id):
    return TipoDedicacionController.actualizar(request, id)

@tipo_dedicacion_bp.route("/<int:id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def eliminar(id):
    return TipoDedicacionController.eliminar(request, id)
