from flask import Blueprint, request
from core.controllers.categoria_utn_controller import CategoriaUtnController
from core.services.middleware import requiere_rol

categoria_utn_bp = Blueprint(
    "categoria_utn",
    __name__,
    url_prefix="/categoria-utn"
)

@categoria_utn_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def crear():
    return CategoriaUtnController.crear(request)


@categoria_utn_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def listar():
    return CategoriaUtnController.listar(request)


@categoria_utn_bp.route("/<int:id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def obtener_por_id(id):
    return CategoriaUtnController.obtener_por_id(request, id)


@categoria_utn_bp.route("/<int:id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def actualizar(id):
    return CategoriaUtnController.actualizar(request, id)


@categoria_utn_bp.route("/<int:id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def eliminar(id):
    return CategoriaUtnController.eliminar(request, id)
