from flask import Blueprint, request
from core.controllers.tipo_formacion_controller import TipoFormacionController
from core.services.middleware import requiere_rol

tipo_formacion_becario_bp = Blueprint(
    "tipo_formacion",
    __name__,
    url_prefix="/tipo-formacion"
)

@tipo_formacion_becario_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def crear():
    return TipoFormacionController.crear(request)

@tipo_formacion_becario_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def listar():
    return TipoFormacionController.listar(request)

@tipo_formacion_becario_bp.route("/<int:id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def obtener(id):
    return TipoFormacionController.obtener_por_id(request, id)

@tipo_formacion_becario_bp.route("/<int:id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def actualizar(id):
    return TipoFormacionController.actualizar(request, id)

@tipo_formacion_becario_bp.route("/<int:id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def eliminar(id):
    return TipoFormacionController.eliminar(request, id)
