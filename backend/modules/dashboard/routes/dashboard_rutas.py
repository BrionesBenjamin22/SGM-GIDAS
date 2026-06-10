from flask import Blueprint

from core.controllers.dashboard_controller import DashboardController
from core.services.middleware import requiere_rol


dashboard_bp = Blueprint(
    "dashboard",
    __name__,
    url_prefix="/dashboards"
)


@dashboard_bp.route("/resumen", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_resumen():
    return DashboardController.get_resumen()
