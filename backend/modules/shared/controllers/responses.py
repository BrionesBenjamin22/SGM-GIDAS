from math import ceil

from flask import g, jsonify

from modules.shared.exceptions import DomainError
from modules.shared.services.logging_config import get_logger


logger = get_logger(__name__)


DEFAULT_ERROR_MESSAGES = {
    "VALIDATION_ERROR": (
        "Lo sentimos, no pudimos guardar los cambios. "
        "Verifique los datos e intente nuevamente."
    ),
    "AUTH_REQUIRED": "Lo sentimos, debe iniciar sesion para continuar.",
    "FORBIDDEN": "Lo sentimos, no tiene permisos para realizar esta accion.",
    "NOT_FOUND": "Lo sentimos, no pudimos encontrar la informacion solicitada.",
    "CONFLICT": (
        "Lo sentimos, la operacion entra en conflicto con el estado actual. "
        "Revise la informacion e intente nuevamente."
    ),
    "RATE_LIMIT_EXCEEDED": (
        "Lo sentimos, recibimos demasiadas solicitudes. "
        "Intente nuevamente en unos minutos."
    ),
    "REQUEST_TOO_LARGE": (
        "Lo sentimos, la solicitud supera el tamano permitido. "
        "Reduzca el contenido e intente nuevamente."
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


def exception_response(error: Exception, *, operation: str):
    if isinstance(error, DomainError):
        return error_response(
            error.code,
            message=error.message,
            details=error.details,
            status_code=error.status_code,
        )

    logger.error(
        "Error interno durante %s exception_type=%s",
        operation,
        type(error).__name__,
    )
    request_id = getattr(g, "request_id", None)
    details = {"request_id": request_id} if request_id else {}
    return error_response(
        "INTERNAL_ERROR",
        details=details,
        status_code=500,
    )
