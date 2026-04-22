from flask import Blueprint, request
from core.controllers.programa_incentivos_controller import (
    ProgramaIncentivosController
)
from core.services.middleware import requiere_rol

programa_incentivos_bp = Blueprint(
    "programa_incentivos",
    __name__,
    url_prefix="/programas-incentivos"
)

@programa_incentivos_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def crear():
    return ProgramaIncentivosController.crear(request)

@programa_incentivos_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def listar():
    return ProgramaIncentivosController.listar(request)

@programa_incentivos_bp.route("/<int:id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def obtener(id):
    return ProgramaIncentivosController.obtener_por_id(request, id)

@programa_incentivos_bp.route("/<int:id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def actualizar(id):
    return ProgramaIncentivosController.actualizar(request, id)

@programa_incentivos_bp.route("/<int:id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def eliminar(id):
    return ProgramaIncentivosController.eliminar(request, id)
