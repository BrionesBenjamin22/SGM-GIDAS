from functools import wraps
from flask import request, jsonify, g, make_response
from core.services.auth_service import AuthService


def _add_cors_headers(response):
    """Agrega headers CORS a la respuesta"""
    response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response


def _cors_jsonify(data, status_code=200):
    """Crea una respuesta JSON con headers CORS"""
    response = make_response(jsonify(data), status_code)
    return _add_cors_headers(response)


def requiere_rol(*roles_permitidos):

    roles_permitidos = [r.upper() for r in roles_permitidos]

    def decorator(func):

        @wraps(func)
        def wrapper(*args, **kwargs):

            auth_header = request.headers.get("Authorization")

            if not auth_header:
                return _cors_jsonify({"error": "Token requerido"}, 401)

            try:
                
                parts = auth_header.split(" ")

                if len(parts) != 2 or parts[0].lower() != "bearer":
                    return _cors_jsonify({"error": "Formato de token inválido"}, 401)

                token = parts[1]

                payload = AuthService.verify_token(token)

                # Guardamos usuario actual en el contexto global
                g.current_user_id = int(payload["sub"])
                g.current_user_rol = payload.get("rol")

                if not g.current_user_rol:
                    return _cors_jsonify({"error": "Rol no presente en token"}, 403)

                if g.current_user_rol.upper() not in roles_permitidos:
                    return _cors_jsonify({
                        "error": "No tiene permisos suficientes"
                    }, 403)

                return func(*args, **kwargs)

            except Exception as e:
                return _cors_jsonify({"error": str(e)}, 401)

        return wrapper

    return decorator
