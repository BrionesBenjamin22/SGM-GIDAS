from flask import Blueprint
from core.controllers.personal_completo_controller import PersonalCompletoController
from core.services.middleware import requiere_rol

personal_completo_bp = Blueprint(
    "personal_completo",
    __name__,
    url_prefix="/personal-all"
)

@personal_completo_bp.route("", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def listar():
    return PersonalCompletoController.listar()

@personal_completo_bp.route("/<string:rol>/<int:id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def obtener_por_id(rol, id):
    return PersonalCompletoController.obtener_por_id(rol, id)
