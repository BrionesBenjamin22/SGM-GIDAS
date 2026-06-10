from flask import Blueprint
from core.controllers.tipo_proyecto_controller import TipoProyectoController
from core.services.middleware import requiere_rol

tipo_proyecto_bp = Blueprint(
    "tipo_proyecto",
    __name__,
    url_prefix="/tipos-proyecto"
)

@tipo_proyecto_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return TipoProyectoController.get_all()

@tipo_proyecto_bp.route("/<int:tipo_id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_by_id(tipo_id):
    return TipoProyectoController.get_by_id(tipo_id)

@tipo_proyecto_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def create():
    return TipoProyectoController.create()

@tipo_proyecto_bp.route("/<int:tipo_id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def update(tipo_id):
    return TipoProyectoController.update(tipo_id)

@tipo_proyecto_bp.route("/<int:tipo_id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def delete(tipo_id):
    return TipoProyectoController.delete(tipo_id)
