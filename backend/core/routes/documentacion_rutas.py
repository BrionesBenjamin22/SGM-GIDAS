from flask import Blueprint
from core.controllers.documentacion_controller import (
    DocumentacionBibliograficaController
)
from core.services.middleware import requiere_rol

documentacion_bibliografica_bp = Blueprint(
    "documentacion_bibliografica",
    __name__,
    url_prefix="/documentacion-bibliografica"
)


# =========================
# LECTURA
# =========================

@documentacion_bibliografica_bp.route("/", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_all():
    return DocumentacionBibliograficaController.get_all()


@documentacion_bibliografica_bp.route("/<int:doc_id>", methods=["GET"])
@requiere_rol("ADMIN", "GESTOR", "LECTURA")
def get_by_id(doc_id):
    return DocumentacionBibliograficaController.get_by_id(doc_id)


# =========================
# MODIFICACIÓN
# =========================

@documentacion_bibliografica_bp.route("/", methods=["POST"])
@requiere_rol("ADMIN", "GESTOR")
def create():
    return DocumentacionBibliograficaController.create()


@documentacion_bibliografica_bp.route("/<int:doc_id>", methods=["PUT"])
@requiere_rol("ADMIN", "GESTOR")
def update(doc_id):
    return DocumentacionBibliograficaController.update(doc_id)


@documentacion_bibliografica_bp.route("/<int:doc_id>", methods=["DELETE"])
@requiere_rol("ADMIN", "GESTOR")
def delete(doc_id):
    return DocumentacionBibliograficaController.delete(doc_id)


# =========================
# RELACIÓN DOCUMENTO - AUTOR
# =========================

@documentacion_bibliografica_bp.route(
    "/<int:doc_id>/autores",
    methods=["POST"]
)
@requiere_rol("ADMIN", "GESTOR")
def add_autor(doc_id):
    return DocumentacionBibliograficaController.add_autor(doc_id)


@documentacion_bibliografica_bp.route(
    "/<int:doc_id>/autores/<int:autor_id>",
    methods=["DELETE"]
)
@requiere_rol("ADMIN", "GESTOR")
def remove_autor(doc_id, autor_id):
    return DocumentacionBibliograficaController.remove_autor(doc_id, autor_id)
