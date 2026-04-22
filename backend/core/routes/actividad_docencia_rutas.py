from flask import Blueprint
from core.controllers.actividad_docencia_controller import (
    ActividadDocenciaController
)
from core.services.middleware import requiere_rol

actividad_docencia_bp = Blueprint(
    "actividad_docencia",
    __name__,
    url_prefix="/actividades-docencia"
)

actividad_docencia_bp.route("", methods=["GET"])(
    requiere_rol("ADMIN", "GESTOR", "LECTURA")(
        ActividadDocenciaController.get_all
    )
)

actividad_docencia_bp.route("/<int:actividad_id>", methods=["GET"])(
    requiere_rol("ADMIN", "GESTOR", "LECTURA")(
        ActividadDocenciaController.get_by_id
    )
)

actividad_docencia_bp.route("/", methods=["POST"])(
    requiere_rol("ADMIN", "GESTOR")(
        ActividadDocenciaController.create
    )
)

actividad_docencia_bp.route("/<int:actividad_id>", methods=["PUT"])(
    requiere_rol("ADMIN", "GESTOR")(
        ActividadDocenciaController.update
    )
)

actividad_docencia_bp.route("/<int:actividad_id>", methods=["DELETE"])(
    requiere_rol("ADMIN", "GESTOR")(
        ActividadDocenciaController.delete
    )
)
