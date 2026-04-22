from flask import Request, Response, jsonify, request

from core.services.auth_service import AuthService


class AuthController:

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
        token = AuthController._get_token_from_request(req)
        return AuthService.verify_token(token)

    @staticmethod
    def _require_admin(payload: dict):
        if payload.get("rol") != "ADMIN":
            raise PermissionError(
                "Acceso denegado. Se requiere rol de administrador."
            )

    @staticmethod
    def primer_usuario():
        try:
            existe = AuthService.existe_primer_usuario()
            return jsonify({"existe": existe}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

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
                except PermissionError as pe:
                    return jsonify({"error": str(pe)}), 403

            user = AuthService.register(
                nombre_usuario=data["nombre_usuario"],
                mail=data["mail"],
                password=data["password"],
                rol_id=data.get("rol_id"),
                nombre_apellido=data.get("nombre_apellido"),
                dni=data.get("dni"),
                es_primer_usuario=es_primer_usuario
            )

            tokens = AuthService.generate_tokens(user)

            return jsonify({
                "mensaje": "Usuario creado exitosamente",
                "usuario": {
                    "id": user.id,
                    "nombre_usuario": user.nombre_usuario,
                    "mail": user.mail,
                    "rol": user.rol.nombre,
                    "primer_login": user.primer_login
                },
                "access_token": tokens["access_token"],
                "refresh_token": tokens["refresh_token"]
            }), 201

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def primer_usuario() -> Response:
        try:
            es_primero = AuthService.es_primer_usuario()
            # El frontend espera { "existe": boolean } donde "existe" es True si YA HAY usuarios.
            # Por lo tanto, si es_primer_usuario es True, significa que "existe" = False
            return jsonify({"existe": not es_primero}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    @staticmethod
    def login() -> Response:
        data = request.get_json()

        try:
            result = AuthService.login(
                nombre_usuario=data["nombre_usuario"],
                password=data["password"]
            )

            return jsonify({
                "access_token": result["access_token"],
                "refresh_token": result["refresh_token"],
                "user": result["user"]
            }), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 401

    @staticmethod
    def perfil(req: Request = None):
        req = req or request
        try:
            payload = AuthController._get_payload_from_request(req)
            user_id = int(payload["sub"])
            user = AuthService.get_user_by_id(user_id)

            return jsonify(user.serialize()), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 401
        except Exception as e:
            return jsonify({"error": str(e)}), 401

    @staticmethod
    def refresh(req: Request = None) -> Response:
        req = req or request
        refresh_token = req.cookies.get("refresh_token")

        if not refresh_token:
            data = req.get_json()
            if data and data.get("refresh_token"):
                refresh_token = data["refresh_token"]

        if not refresh_token:
            return jsonify({"error": "Refresh token requerido"}), 401

        try:
            new_access_token = AuthService.refresh_access_token(refresh_token)
            return jsonify({"access_token": new_access_token}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 401

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
        except Exception as e:
            return jsonify({"error": str(e)}), 400

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
        except Exception as e:
            return jsonify({"error": str(e)}), 400

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
        except PermissionError as pe:
            return jsonify({"error": str(pe)}), 403
        except Exception as e:
            return jsonify({"error": str(e)}), 400

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
        except Exception as e:
            return jsonify({"error": str(e)}), 404

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
        except Exception as e:
            return jsonify({"error": str(e)}), 400

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
        except PermissionError as pe:
            return jsonify({"error": str(pe)}), 403
        except Exception as e:
            return jsonify({"error": str(e)}), 400
