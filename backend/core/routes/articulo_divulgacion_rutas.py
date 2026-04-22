from flask import Blueprint
from core.controllers.articulo_divulgacion_controller import (
    ArticuloDivulgacionController
)
from core.services.middleware import requiere_rol

articulo_divulgacion_bp = Blueprint(
    "articulo_divulgacion_bp",
    __name__,
    url_prefix="/articulos-divulgacion"
)

# -------------------------------------------------
# CREATE (ADMIN o GESTOR)
# -------------------------------------------------
@articulo_divulgacion_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def crear():
    return ArticuloDivulgacionController.crear()


# -------------------------------------------------
# LISTAR (todos pueden leer)
# -------------------------------------------------
@articulo_divulgacion_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def listar():
    return ArticuloDivulgacionController.listar()


# -------------------------------------------------
# OBTENER POR ID
# -------------------------------------------------
@articulo_divulgacion_bp.route("/<int:articulo_id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def obtener_por_id(articulo_id):
    return ArticuloDivulgacionController.obtener_por_id(articulo_id)


# -------------------------------------------------
# ACTUALIZAR (ADMIN o GESTOR)
# -------------------------------------------------
@articulo_divulgacion_bp.route("/<int:articulo_id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def actualizar(articulo_id):
    return ArticuloDivulgacionController.actualizar(articulo_id)


# -------------------------------------------------
# ELIMINAR (ADMIN o GESTOR)
# -------------------------------------------------
@articulo_divulgacion_bp.route("/<int:articulo_id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def eliminar(articulo_id):
    return ArticuloDivulgacionController.eliminar(articulo_id)
