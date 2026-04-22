from flask import Blueprint, request
from core.controllers.visita_controller import (
    VisitaAcademicaController
)
from core.services.middleware import requiere_rol

visita_academica_bp = Blueprint(
    "visita_academica",
    __name__,
    url_prefix="/visitas-academicas"
)

@visita_academica_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def crear():
    return VisitaAcademicaController.crear(request)

@visita_academica_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def listar():
    return VisitaAcademicaController.listar(request)

@visita_academica_bp.route("/<int:id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def obtener(id):
    return VisitaAcademicaController.obtener_por_id(request, id)

@visita_academica_bp.route("/<int:id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def actualizar(id):
    return VisitaAcademicaController.actualizar(request, id)

@visita_academica_bp.route("/<int:id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def eliminar(id):
    return VisitaAcademicaController.eliminar(request, id)
