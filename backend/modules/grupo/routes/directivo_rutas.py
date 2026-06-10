from flask import Blueprint
from core.controllers.directivo_controller import DirectivoController
from core.services.middleware import requiere_rol

directivo_bp = Blueprint(
    "directivo",
    __name__,
    url_prefix="/directivos"
)

# =====================================================
# CONSULTAS
# =====================================================

# Ver todos los directivos (ADMIN, GESTOR, LECTURA)
@directivo_bp.route("", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return DirectivoController.get_all()


# Ver directivos por grupo
@directivo_bp.route("/grupo/<int:grupo_id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_por_grupo(grupo_id):
    return DirectivoController.get_por_grupo(grupo_id)


# Ver directivos actuales por grupo
@directivo_bp.route("/grupo/<int:grupo_id>/actuales", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_actuales(grupo_id):
    return DirectivoController.get_actuales(grupo_id)


# =====================================================
# MODIFICACIONES (requieren escritura)
# =====================================================

# Crear directivo
@directivo_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def create():
    return DirectivoController.create()


# Actualizar directivo
@directivo_bp.route("/<int:directivo_id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def update(directivo_id):
    return DirectivoController.update(directivo_id)


# Asignar directivo a grupo
@directivo_bp.route("/asignar", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def asignar():
    return DirectivoController.asignar()


# Finalizar cargo
@directivo_bp.route("/finalizar", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def finalizar():
    return DirectivoController.finalizar()