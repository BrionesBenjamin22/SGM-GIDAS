from functools import wraps

from flask import g, jsonify, request

from modules.auth.services.auth_service import AuthService


def _error_json(data, status_code=200):
    return jsonify(data), status_code


def _authenticate_request():
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None, _error_json({"error": "Token requerido"}, 401)

    parts = auth_header.split(" ")

    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1]:
        return None, _error_json({"error": "Formato de token invalido"}, 401)

    try:
        payload = AuthService.verify_token(parts[1])
        g.current_user_payload = payload
        g.current_user_id = int(payload["sub"])
        g.current_user_rol = payload.get("rol")
        return payload, None
    except Exception as e:
        return None, _error_json({"error": str(e)}, 401)


def requiere_auth(func):

    @wraps(func)
    def wrapper(*args, **kwargs):
        _, error_response = _authenticate_request()
        if error_response:
            return error_response

        return func(*args, **kwargs)

    return wrapper


def requiere_rol(*roles_permitidos):
    roles_permitidos = [r.upper() for r in roles_permitidos]

    def decorator(func):

        @wraps(func)
        def wrapper(*args, **kwargs):
            _, error_response = _authenticate_request()
            if error_response:
                return error_response

            if not g.current_user_rol:
                return _error_json({"error": "Rol no presente en token"}, 403)

            if g.current_user_rol.upper() not in roles_permitidos:
                return _error_json({"error": "No tiene permisos suficientes"}, 403)

            return func(*args, **kwargs)

        return wrapper

    return decorator
