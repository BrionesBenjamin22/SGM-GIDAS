from flask import Request, Response, g, jsonify, request

from urllib.parse import urlsplit

from flask import current_app

from modules.auth.services.auth_service import AuthService
from modules.shared.controllers.responses import error_response
from modules.shared.services.logging_config import get_logger


logger = get_logger(__name__)


class AuthController:

    @staticmethod
    def _cookie_options() -> dict:
        return {
            "httponly": current_app.config["REFRESH_COOKIE_HTTPONLY"],
            "secure": current_app.config["REFRESH_COOKIE_SECURE"],
            "samesite": current_app.config["REFRESH_COOKIE_SAMESITE"],
            "path": current_app.config["REFRESH_COOKIE_PATH"],
        }

    @staticmethod
    def _set_refresh_cookie(response: Response, token: str) -> None:
        response.set_cookie(
            current_app.config["REFRESH_COOKIE_NAME"], token,
            max_age=current_app.config["REFRESH_TOKEN_EXPIRATION_MINUTES"] * 60,
            **AuthController._cookie_options(),
        )
        response.headers["Cache-Control"] = "no-store"

    @staticmethod
    def _delete_refresh_cookie(response: Response) -> None:
        response.delete_cookie(
            current_app.config["REFRESH_COOKIE_NAME"],
            **AuthController._cookie_options(),
        )
        response.headers["Cache-Control"] = "no-store"

    @staticmethod
    def _no_store(result):
        response = result[0] if isinstance(result, tuple) else result
        response.headers["Cache-Control"] = "no-store"
        return result

    @staticmethod
    def _normalized_origin(
        value: str | None,
        allow_path: bool = False,
    ) -> str | None:
        if not value:
            return None
        parsed = urlsplit(value.strip())
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.netloc
            or parsed.username is not None
            or parsed.password is not None
            or parsed.query
            or parsed.fragment
            or (not allow_path and parsed.path not in {"", "/"})
        ):
            return None
        return f"{parsed.scheme.lower()}://{parsed.netloc.lower()}"

    @staticmethod
    def _is_trusted_cookie_request(req: Request) -> bool:
        origin_header = req.headers.get("Origin")
        supplied = AuthController._normalized_origin(origin_header)
        if origin_header is None:
            supplied = AuthController._normalized_origin(
                req.headers.get("Referer"),
                allow_path=True,
            )
        trusted = {
            AuthController._normalized_origin(origin)
            for origin in current_app.config["FRONTEND_URLS"]
        }
        trusted.discard(None)
        return supplied in trusted

    @staticmethod
    def _unexpected_error(status_code: int = 500):
        logger.exception("Error interno en operacion de autenticacion")
        return error_response("INTERNAL_ERROR", status_code=status_code)

    @staticmethod
    def _get_token_from_request(req: Request = None) -> str:
        req = req or request
        auth_header = req.headers.get("Authorization")
        if not auth_header:
            raise ValueError("Token requerido")

        parts = auth_header.split(" ")
        if len(parts) != 2 or not parts[1]:
            raise ValueError("Token invalido")

        return parts[1]

    @staticmethod
    def _get_payload_from_request(req: Request = None) -> dict:
        if hasattr(g, "current_user_payload"):
            return g.current_user_payload

        token = AuthController._get_token_from_request(req)
        return AuthService.verify_token(token)

    @staticmethod
    def _require_admin(payload: dict):
        if payload.get("rol") != "ADMIN":
            raise PermissionError(
                "Acceso denegado. Se requiere rol de administrador."
            )

    @staticmethod
    def _request_metadata(req: Request = None) -> dict:
        req = req or request
        return {
            "user_agent": req.headers.get("User-Agent"),
            "ip_address": req.headers.get("X-Forwarded-For", req.remote_addr),
        }

    @staticmethod
    def primer_usuario():
        try:
            existe = AuthService.existe_primer_usuario()
            return jsonify({"existe": existe}), 200
        except Exception:
            return AuthController._unexpected_error(500)

    @staticmethod
    def register(req: Request = None) -> Response:
        req = req or request
        data = req.get_json()

        try:
            es_primer_usuario = not AuthService.existe_primer_usuario()

            if not es_primer_usuario:
                try:
                    payload = AuthController._get_payload_from_request(req)
                    AuthController._require_admin(payload)
                except ValueError:
                    return jsonify({
                        "error": "Token requerido. El sistema ya tiene usuarios registrados."
                    }), 403
                except PermissionError:
                    return error_response("FORBIDDEN", status_code=403)

            user = AuthService.register(
                nombre_usuario=data["nombre_usuario"],
                mail=data["mail"],
                password=data["password"],
                rol_id=data.get("rol_id"),
                nombre_apellido=data.get("nombre_apellido"),
                dni=data.get("dni"),
                es_primer_usuario=es_primer_usuario
            )

            tokens = AuthService.generate_tokens(
                user,
                persist_refresh=True,
                metadata=AuthController._request_metadata(req),
            )

            response = jsonify({
                "mensaje": "Usuario creado exitosamente",
                "usuario": {
                    "id": user.id,
                    "nombre_usuario": user.nombre_usuario,
                    "mail": user.mail,
                    "rol": user.rol.nombre,
                    "primer_login": user.primer_login
                },
                "access_token": tokens["access_token"]
            })
            AuthController._set_refresh_cookie(response, tokens["refresh_token"])
            return response, 201

        except Exception:
            return AuthController._no_store(AuthController._unexpected_error(400))

    @staticmethod
    def primer_usuario() -> Response:
        try:
            es_primero = AuthService.es_primer_usuario()
            # El frontend espera { "existe": boolean } donde "existe" es True si YA HAY usuarios.
            # Por lo tanto, si es_primer_usuario es True, significa que "existe" = False
            return jsonify({"existe": not es_primero}), 200
        except Exception:
            return AuthController._unexpected_error(500)


    @staticmethod
    def login() -> Response:
        data = request.get_json()

        try:
            result = AuthService.login(
                nombre_usuario=data["nombre_usuario"],
                password=data["password"],
                metadata=AuthController._request_metadata(request),
            )

            response = jsonify({
                "access_token": result["access_token"],
                "user": result["user"]
            })
            AuthController._set_refresh_cookie(response, result["refresh_token"])
            return response, 200

        except Exception:
            return AuthController._no_store(AuthController._unexpected_error(401))

    @staticmethod
    def perfil(req: Request = None):
        req = req or request
        try:
            payload = AuthController._get_payload_from_request(req)
            user_id = int(payload["sub"])
            user = AuthService.get_user_by_id(user_id, solo_activos=True)

            return jsonify(user.serialize()), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 401
        except Exception:
            return AuthController._unexpected_error(401)

    @staticmethod
    def refresh(req: Request = None) -> Response:
        req = req or request
        if not AuthController._is_trusted_cookie_request(req):
            return AuthController._no_store(
                error_response("FORBIDDEN", status_code=403)
            )

        refresh_token = req.cookies.get(current_app.config["REFRESH_COOKIE_NAME"])

        if not refresh_token:
            return AuthController._no_store(
                (jsonify({"error": "Refresh token requerido"}), 401)
            )

        try:
            tokens = AuthService.refresh_tokens(
                refresh_token,
                metadata=AuthController._request_metadata(req),
            )
            response = jsonify({
                "access_token": tokens["access_token"],
                "user": tokens["user"],
            })
            AuthController._set_refresh_cookie(response, tokens["refresh_token"])
            return response, 200

        except Exception:
            return AuthController._no_store(AuthController._unexpected_error(401))

    @staticmethod
    def logout(req: Request = None) -> Response:
        req = req or request
        refresh_token = req.cookies.get(current_app.config["REFRESH_COOKIE_NAME"])
        response = jsonify({"mensaje": "Sesion cerrada exitosamente"})

        if not AuthController._is_trusted_cookie_request(req):
            return AuthController._no_store(
                error_response("FORBIDDEN", status_code=403)
            )

        try:
            if refresh_token:
                AuthService.revoke_refresh_token(refresh_token, reason="logout")
        except Exception:
            logger.warning("No se pudo revocar la sesion durante logout")

        AuthController._delete_refresh_cookie(response)
        return response, 200

    @staticmethod
    def change_password(req: Request = None) -> Response:
        req = req or request
        try:
            payload = AuthController._get_payload_from_request(req)
            user_id = int(payload["sub"])

            data = req.get_json()
            password_actual = data.get("password_actual")
            password_nueva = data.get("password_nueva")
            password_confirmacion = data.get("password_confirmacion")

            if not password_nueva or not password_confirmacion:
                return jsonify({
                    "error": "password_nueva y password_confirmacion son requeridos"
                }), 400

            if password_nueva != password_confirmacion:
                return jsonify({
                    "error": "La nueva contrasena y la confirmacion no coinciden"
                }), 400

            if len(password_nueva) < 6:
                return jsonify({
                    "error": "La contrasena debe tener al menos 6 caracteres"
                }), 400

            user = AuthService.get_user_by_id(user_id)
            es_primer_cambio = user.primer_login

            if not es_primer_cambio and not password_actual:
                return jsonify({"error": "password_actual es requerido"}), 400

            AuthService.change_password(
                user_id=user_id,
                password_actual=password_actual,
                password_nueva=password_nueva,
                es_primer_cambio=es_primer_cambio
            )

            return jsonify({"mensaje": "Contrasena actualizada exitosamente"}), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 401
        except Exception:
            return AuthController._unexpected_error(400)

    @staticmethod
    def delete_user(user_id: int, req: Request = None):
        req = req or request
        try:
            payload = AuthController._get_payload_from_request(req)
            current_user_id = int(payload["sub"])

            AuthService.delete_user(
                user_id=user_id,
                current_user_id=current_user_id
            )

            return jsonify({"mensaje": "Usuario eliminado exitosamente"}), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 401
        except Exception:
            return AuthController._unexpected_error(400)

    @staticmethod
    def get_all_users(req: Request = None):
        req = req or request
        try:
            payload = AuthController._get_payload_from_request(req)
            AuthController._require_admin(payload)

            users = AuthService.get_all_users()
            return jsonify([user.serialize() for user in users]), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 401
        except PermissionError:
            return error_response("FORBIDDEN", status_code=403)
        except Exception:
            return AuthController._unexpected_error(400)

    @staticmethod
    def get_user_by_id(user_id: int, req: Request = None):
        req = req or request
        try:
            payload = AuthController._get_payload_from_request(req)
            if payload.get("rol") != "ADMIN" and int(payload["sub"]) != user_id:
                return jsonify({
                    "error": "Acceso denegado. Se requiere rol de administrador."
                }), 403

            user = AuthService.get_user_by_id(user_id)
            return jsonify(user.serialize()), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 401
        except Exception:
            return AuthController._unexpected_error(404)

    @staticmethod
    def update_user(user_id: int, req: Request = None):
        req = req or request
        try:
            payload = AuthController._get_payload_from_request(req)
            current_user_id = int(payload["sub"])

            if payload.get("rol") != "ADMIN" and current_user_id != user_id:
                return jsonify({
                    "error": "Acceso denegado. Se requiere rol de administrador."
                }), 403

            data = req.get_json()

            if payload.get("rol") != "ADMIN" and (
                "rol_id" in data or "activo" in data
            ):
                return jsonify({
                    "error": "No tiene permisos para cambiar rol o estado activo"
                }), 403

            user = AuthService.update_user(user_id, data, current_user_id)

            return jsonify({
                "mensaje": "Usuario actualizado exitosamente",
                "usuario": user.serialize()
            }), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 401
        except Exception:
            return AuthController._unexpected_error(400)

    @staticmethod
    def create_user(req: Request = None):
        req = req or request
        try:
            payload = AuthController._get_payload_from_request(req)
            AuthController._require_admin(payload)

            data = req.get_json()

            if not data.get("nombre_usuario") or not data.get("mail") or not data.get("password"):
                return jsonify({
                    "error": "nombre_usuario, mail y password son requeridos"
                }), 400

            if not data.get("rol_id"):
                return jsonify({"error": "rol_id es requerido"}), 400

            if len(data.get("password", "")) < 6:
                return jsonify({
                    "error": "La contrasena debe tener al menos 6 caracteres"
                }), 400

            rol = AuthService.get_rol_by_id(data["rol_id"])
            if not rol:
                return jsonify({"error": "Rol no encontrado"}), 400

            user = AuthService.register(
                nombre_usuario=data["nombre_usuario"],
                mail=data["mail"],
                password=data["password"],
                rol_id=data["rol_id"],
                nombre_apellido=data.get("nombre_apellido", data["nombre_usuario"]),
                dni=data.get("dni", 0),
                es_primer_usuario=False
            )

            return jsonify({
                "mensaje": "Usuario creado exitosamente",
                "usuario": user.serialize()
            }), 201

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 401
        except PermissionError:
            return error_response("FORBIDDEN", status_code=403)
        except Exception:
            return AuthController._unexpected_error(400)
