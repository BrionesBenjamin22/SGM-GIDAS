from flask import Blueprint, request
from core.controllers.programa_actividades_controller import (
    PlanificacionGrupoController
)
from core.services.middleware import requiere_rol

planificacion_grupo_bp = Blueprint(
    "planificacion_grupo",
    __name__,
    url_prefix="/planificaciones"
)

@planificacion_grupo_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def crear():
    return PlanificacionGrupoController.crear(request)

@planificacion_grupo_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def listar():
    return PlanificacionGrupoController.listar(request)

@planificacion_grupo_bp.route("/<int:id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def obtener(id):
    return PlanificacionGrupoController.obtener_por_id(request, id)

@planificacion_grupo_bp.route("/<int:id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def actualizar(id):
    return PlanificacionGrupoController.actualizar(request, id)

@planificacion_grupo_bp.route("/<int:id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def eliminar(id):
    return PlanificacionGrupoController.eliminar(request, id)
