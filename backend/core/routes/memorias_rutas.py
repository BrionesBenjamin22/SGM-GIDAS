from flask import Blueprint

from core.controllers.memoria_controller import MemoriaController
from core.services.middleware import requiere_rol


memoria_bp = Blueprint(
    "memoria",
    __name__,
    url_prefix="/memorias"
)


# LECTURA
@memoria_bp.route("", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return MemoriaController.get_all()


@memoria_bp.route("/<int:memoria_id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_by_id(memoria_id):
    return MemoriaController.get_by_id(memoria_id)


@memoria_bp.route("/<int:memoria_id>/versiones/<int:memoria_version_id>/investigadores", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_investigadores_snapshot(memoria_id, memoria_version_id):
    return MemoriaController.get_investigadores_snapshot(
        memoria_id,
        memoria_version_id
    )


@memoria_bp.route("/<int:memoria_id>/versiones/<int:memoria_version_id>/becarios", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_becarios_snapshot(memoria_id, memoria_version_id):
    return MemoriaController.get_becarios_snapshot(
        memoria_id,
        memoria_version_id
    )


@memoria_bp.route("/<int:memoria_id>/versiones/<int:memoria_version_id>/personal", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_personal_snapshot(memoria_id, memoria_version_id):
    return MemoriaController.get_personal_snapshot(
        memoria_id,
        memoria_version_id
    )


# MODIFICACION
@memoria_bp.route("", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def create():
    return MemoriaController.create()


@memoria_bp.route("/<int:memoria_id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def update(memoria_id):
    return MemoriaController.update(memoria_id)


@memoria_bp.route("/<int:memoria_id>", methods=["DELETE"])
@requiere_rol("ADMIN")
def delete(memoria_id):
    return MemoriaController.delete(memoria_id)


@memoria_bp.route("/<int:memoria_id>/estado", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def change_status(memoria_id):
    return MemoriaController.change_status(memoria_id)


@memoria_bp.route("/<int:memoria_id>/reabrir", methods=["PUT"])
@requiere_rol("ADMIN")
def reopen(memoria_id):
    return MemoriaController.reopen(memoria_id)
