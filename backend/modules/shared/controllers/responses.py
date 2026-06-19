from math import ceil

from flask import jsonify


DEFAULT_ERROR_MESSAGES = {
    "VALIDATION_ERROR": (
        "Lo sentimos, no pudimos guardar los cambios. "
        "Verifique los datos e intente nuevamente."
    ),
    "AUTH_REQUIRED": "Lo sentimos, debe iniciar sesion para continuar.",
    "FORBIDDEN": "Lo sentimos, no tiene permisos para realizar esta accion.",
    "NOT_FOUND": "Lo sentimos, no pudimos encontrar la informacion solicitada.",
    "RATE_LIMIT_EXCEEDED": (
        "Lo sentimos, recibimos demasiadas solicitudes. "
        "Intente nuevamente en unos minutos."
    ),
    "INTERNAL_ERROR": (
        "Lo sentimos, no pudimos completar la operacion. "
        "Intente nuevamente."
    ),
}


def success_response(data=None, meta=None, status_code=200):
    payload = {
        "data": data,
        "meta": meta or {},
        "error": None,
    }
    return jsonify(payload), status_code


def paginated_response(data, page, per_page, total, meta=None, status_code=200):
    total_pages = max(1, ceil(total / per_page)) if per_page else 1
    pagination_meta = {
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": total_pages,
    }
    if meta:
        pagination_meta.update(meta)

    return success_response(data=data, meta=pagination_meta, status_code=status_code)


def error_response(code, message=None, details=None, status_code=400):
    payload = {
        "data": None,
        "error": {
            "code": code,
            "message": message or DEFAULT_ERROR_MESSAGES.get(
                code,
                DEFAULT_ERROR_MESSAGES["INTERNAL_ERROR"],
            ),
            "details": details or {},
        },
    }
    return jsonify(payload), status_code
