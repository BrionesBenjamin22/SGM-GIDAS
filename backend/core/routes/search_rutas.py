from flask import Blueprint
from core.controllers.search_controller import SearchController
from core.services.middleware import requiere_rol

search_bp = Blueprint(
    "search",
    __name__
)


@search_bp.route("/search/", methods=["GET"], strict_slashes=False)
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def buscar():
    """
    Endpoint principal de búsqueda global

    GET /search?q=<texto>&orden=<orden>

    Parámetros:
        - q (requerido): texto a buscar
        - orden (opcional):
            alf_asc
            alf_desc
            fecha_asc
            fecha_desc

    Ejemplos:
        GET /search?q=Perez
        GET /search?q=UTN&orden=fecha_desc
    """
    return SearchController.buscar()
