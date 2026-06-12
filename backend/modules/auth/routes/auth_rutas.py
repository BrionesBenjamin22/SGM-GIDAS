from flask import Blueprint, current_app
from modules.auth.controllers.auth_controller import AuthController
from modules.shared.services.middleware import requiere_auth, requiere_rol
from extension import limiter

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


# -------------------------
# ¿Primer Usuario? (Para habilitar registro inicial)
# -------------------------
@auth_bp.route("/primer-usuario", methods=["GET"])
def primer_usuario():
    return AuthController.primer_usuario()

# -------------------------
# Registro
# -------------------------
@auth_bp.route("/register", methods=["POST"])
@limiter.limit(lambda: current_app.config["AUTH_REGISTER_LIMIT"])
def register():
    return AuthController.register()


# -------------------------
# Login
# -------------------------
@auth_bp.route("/login", methods=["POST"])
@limiter.limit(lambda: current_app.config["AUTH_LOGIN_LIMIT"])
def login():
    return AuthController.login()


# -------------------------
# Perfil (requiere token)
# -------------------------
@auth_bp.route("/perfil", methods=["GET"])
@requiere_auth
def perfil():
    return AuthController.perfil()


# -------------------------
# Refresh token
# -------------------------
@auth_bp.route("/refresh", methods=["POST"])
@limiter.limit(lambda: current_app.config["AUTH_REFRESH_LIMIT"])
def refresh():
    return AuthController.refresh()


# -------------------------
# Change password (POST según especificación del frontend)
# -------------------------
@auth_bp.route("/cambiar-password", methods=["POST"])
@limiter.limit(lambda: current_app.config["AUTH_CHANGE_PASSWORD_LIMIT"])
@requiere_auth
def change_password():
    return AuthController.change_password()


# -------------------------
# Soft Delete Usuario
# -------------------------
@auth_bp.route("/usuarios/<int:user_id>", methods=["DELETE"])
@requiere_rol("ADMIN")
def delete_user(user_id):
    return AuthController.delete_user(user_id)


# -------------------------
# CRUD Usuarios (Nuevos endpoints para gestión de usuarios)
# -------------------------

# Listar todos los usuarios (solo ADMIN)
@auth_bp.route("/usuarios", methods=["GET"])
@requiere_rol("ADMIN")
def get_all_users():
    return AuthController.get_all_users()

# Crear nuevo usuario (solo ADMIN)
@auth_bp.route("/usuarios", methods=["POST"])
@requiere_rol("ADMIN")
def create_user():
    return AuthController.create_user()

# Obtener usuario por ID (ADMIN o el propio usuario)
@auth_bp.route("/usuarios/<int:user_id>", methods=["GET"])
@requiere_auth
def get_user_by_id(user_id):
    return AuthController.get_user_by_id(user_id)

# Actualizar usuario (ADMIN o el propio usuario)
@auth_bp.route("/usuarios/<int:user_id>", methods=["PUT"])
@requiere_auth
def update_user(user_id):
    return AuthController.update_user(user_id)
