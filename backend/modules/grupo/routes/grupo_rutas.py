from flask import Blueprint, request
from core.controllers.grupo_controller import GrupoUtnController
from core.services.middleware import requiere_rol

grupo_utn_bp = Blueprint(
    "grupo_utn",
    __name__,
    url_prefix="/grupo-utn"
)

# -------------------------
# Crear grupo UTN
# -------------------------
@grupo_utn_bp.route("/", methods=["POST"], strict_slashes=False)
@requiere_rol("ADMIN", "GESTOR")
def crear():
    return GrupoUtnController.crear()

# -------------------------
# Obtener grupo UTN
# -------------------------
@grupo_utn_bp.route("/", methods=["GET"], strict_slashes=False)
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def obtener():
    return GrupoUtnController.obtener()


# -------------------------
# Actualizar grupo UTN
# -------------------------
@grupo_utn_bp.route("/", methods=["PUT"], strict_slashes=False)
@requiere_rol("ADMIN", "GESTOR")
def actualizar():
    return GrupoUtnController.actualizar()

# -------------------------
# Eliminar grupo UTN
# -------------------------
@grupo_utn_bp.route("/", methods=["DELETE"], strict_slashes=False)
@requiere_rol("ADMIN", "GESTOR")
def eliminar():
    return GrupoUtnController.eliminar()


@grupo_utn_bp.route("/restore", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def restaurar():
    return GrupoUtnController.restaurar()

@grupo_utn_bp.route("/exportar-excel", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR")
def exportar():
    return GrupoUtnController.exportar_excel()
