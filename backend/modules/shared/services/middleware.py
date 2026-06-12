from functools import wraps

from flask import g, jsonify, make_response, request

from modules.auth.services.auth_service import AuthService


def _add_cors_headers(response):
    """Agrega headers CORS a la respuesta."""
    origin = request.headers.get("Origin")
    if origin:
        response.headers.add("Access-Control-Allow-Origin", origin)
        response.headers.add("Vary", "Origin")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response


def _cors_jsonify(data, status_code=200):
    """Crea una respuesta JSON con headers CORS."""
    response = make_response(jsonify(data), status_code)
    return _add_cors_headers(response)


def _authenticate_request():
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None, _cors_jsonify({"error": "Token requerido"}, 401)

    parts = auth_header.split(" ")

    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1]:
        return None, _cors_jsonify({"error": "Formato de token invalido"}, 401)

    try:
        payload = AuthService.verify_token(parts[1])
        g.current_user_payload = payload
        g.current_user_id = int(payload["sub"])
        g.current_user_rol = payload.get("rol")
        return payload, None
    except Exception as e:
        return None, _cors_jsonify({"error": str(e)}, 401)


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
                return _cors_jsonify({"error": "Rol no presente en token"}, 403)

            if g.current_user_rol.upper() not in roles_permitidos:
                return _cors_jsonify({"error": "No tiene permisos suficientes"}, 403)

            return func(*args, **kwargs)

        return wrapper

    return decorator
