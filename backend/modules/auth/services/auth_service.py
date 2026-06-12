import jwt
import datetime
from modules.auth.models.persona import Persona
from modules.auth.models.usuario import Usuario, RolUsuario
from extension import db
from config import Config


class AuthService:

    @staticmethod
    def _access_token_expires_at() -> datetime.datetime:
        return datetime.datetime.utcnow() + datetime.timedelta(
            minutes=Config.JWT_EXPIRATION_MINUTES
        )

    @staticmethod
    def _with_optional_audience(payload: dict) -> dict:
        if Config.JWT_AUDIENCE:
            return {**payload, "aud": Config.JWT_AUDIENCE}
        return payload

    @staticmethod
    def _decode_access_token(token: str) -> dict:
        decode_kwargs = {
            "issuer": Config.JWT_ISSUER,
            "algorithms": [Config.JWT_ALGORITHM],
        }

        if Config.JWT_AUDIENCE:
            decode_kwargs["audience"] = Config.JWT_AUDIENCE
        else:
            decode_kwargs["options"] = {"verify_aud": False}

        return jwt.decode(token, Config.JWT_SECRET, **decode_kwargs)

    @staticmethod
    def _decode_refresh_token(token: str) -> dict:
        return jwt.decode(
            token,
            Config.REFRESH_SECRET,
            issuer=Config.JWT_ISSUER,
            algorithms=[Config.JWT_ALGORITHM],
            options={"verify_aud": False},
        )

    @staticmethod
    def _get_user_or_error(user_id: int, solo_activos: bool = False) -> Usuario:
        user = db.session.get(Usuario, user_id)

        if not user:
            raise Exception("Usuario no encontrado")

        if solo_activos and (not user.activo or user.deleted_at is not None):
            raise Exception("Usuario no encontrado")

        return user

    @staticmethod
    def generate_tokens(user: Usuario) -> dict:
        access_payload = AuthService._with_optional_audience({
            "sub": str(user.id),
            "nombre_usuario": user.nombre_usuario,
            "rol": user.rol.nombre,   
            "exp": AuthService._access_token_expires_at(),
            "iss": Config.JWT_ISSUER
        })

        refresh_payload = {
            "sub": str(user.id),
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
            "iss": Config.JWT_ISSUER
        }

        access_token = jwt.encode(
            access_payload,
            Config.JWT_SECRET,
            algorithm=Config.JWT_ALGORITHM
        )

        refresh_token = jwt.encode(
            refresh_payload,
            Config.REFRESH_SECRET,
            algorithm=Config.JWT_ALGORITHM
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    # -------------------------
    # Verificar si existe primer usuario
    # -------------------------
    @staticmethod
    def existe_primer_usuario() -> bool:
        """Verifica si existe al menos un usuario en el sistema"""
        return Usuario.query.first() is not None

    # -------------------------
    # Login
    # -------------------------
    @staticmethod
    def login(nombre_usuario: str, password: str) -> dict:

        user = Usuario.query.filter_by(
            nombre_usuario=nombre_usuario,
            activo=True   # importante para evitar login de usuarios eliminados
        ).filter(Usuario.deleted_at.is_(None)).first()

        if not user or not user.verificar_password(password):
            raise Exception("Credenciales inválidas")

        tokens = AuthService.generate_tokens(user)

        return {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "user": {
                "id": user.id,
                "nombre_usuario": user.nombre_usuario,
                "mail": user.mail,
                "rol": user.rol.nombre,
                "primer_login": user.primer_login
            }
        }

    # -------------------------
    # ¿Es Primer Usuario?
    # -------------------------
    @staticmethod
    def es_primer_usuario() -> bool:
        """Devuelve True si NO hay ningún usuario en la base de datos."""
        count = Usuario.query.count()
        return count == 0

    # -------------------------
    # Registro
    # -------------------------
    @staticmethod
    def register(
        nombre_usuario: str,
        mail: str,
        password: str,
        rol_id: int | None = None,
        nombre_apellido: str | None = None,
        dni: str | None = None,
        es_primer_usuario: bool = False
    ) -> Usuario:
        existe = Usuario.query.filter(
            (Usuario.nombre_usuario == nombre_usuario) |
            (Usuario.mail == mail)
        ).first()

        if existe:
            raise Exception("Usuario o mail ya existe")

        if es_primer_usuario:
            rol = RolUsuario.query.filter_by(nombre="ADMIN").first()
            if not rol:
                raise Exception("Rol ADMIN no encontrado en el sistema")
            primer_login = False
        else:
            primer_login = True
            if not rol_id:
                raise Exception("rol_id es obligatorio para crear usuarios")
            rol = RolUsuario.query.get(rol_id)
            if not rol:
                raise Exception("Rol inválido")

        persona_id = None
        if nombre_apellido and dni:
            persona = Persona(
                nombre_apellido=nombre_apellido,
                dni=dni
            )
            db.session.add(persona)
            db.session.flush()
            persona_id = persona.id

        nuevo_usuario = Usuario(
            nombre_usuario=nombre_usuario,
            mail=mail,
            id_persona=persona_id,
            id_rol=rol.id,
            primer_login=primer_login
        )

        nuevo_usuario.set_password(password)

        db.session.add(nuevo_usuario)

        try:
            db.session.commit()
            return nuevo_usuario
        except Exception:
            db.session.rollback()
            raise Exception("Error al registrar usuario")        
        
    # -------------------------
    # Refresh token
    # -------------------------
    @staticmethod
    def refresh_access_token(refresh_token: str) -> str:
        try:
            payload = AuthService._decode_refresh_token(refresh_token)

            user_id = int(payload["sub"])
            user = AuthService._get_user_or_error(user_id, solo_activos=True)

            new_access_payload = AuthService._with_optional_audience({
                "sub": str(user.id),
                "nombre_usuario": user.nombre_usuario,
                "rol": user.rol.nombre,   # 🔥 AGREGAR ESTO
                "exp": AuthService._access_token_expires_at(),
                "iss": Config.JWT_ISSUER
            })

            return jwt.encode(
                new_access_payload,
                Config.JWT_SECRET,
                algorithm=Config.JWT_ALGORITHM
            )

        except jwt.ExpiredSignatureError:
            raise Exception("Refresh token expirado")
        except jwt.InvalidTokenError:
            raise Exception("Refresh token inválido")

    # -------------------------
    # Verificar token
    # -------------------------
    @staticmethod
    def verify_token(token: str) -> dict:
        try:
            return AuthService._decode_access_token(token)
        except jwt.ExpiredSignatureError:
            raise Exception("Token expirado")
        except jwt.InvalidTokenError:
            raise Exception("Token inválido")

    # -------------------------
    # Cambiar contraseña    
    # -------------------------
        
    @staticmethod
    def change_password(user_id: int, password_actual: str, password_nueva: str, es_primer_cambio: bool = False):
        user = AuthService._get_user_or_error(user_id, solo_activos=True)
        if not password_nueva:
            raise Exception("La contraseña nueva es obligatoria")

        if not es_primer_cambio:
            user.cambiar_password(password_actual, password_nueva)
        else:
            user.set_password(password_nueva)

        user.primer_login = False

        try:
            db.session.commit()
            return user
        except Exception:
            db.session.rollback()
            raise Exception("Error al cambiar la contraseña")
        
    
    
    @staticmethod
    def delete_user(user_id: int, current_user_id: int):

        user = AuthService._get_user_or_error(user_id, solo_activos=True)
        
        # Evitar que un admin se elimine a sí mismo
        if user_id == current_user_id:
            raise Exception("No puede eliminar su propia cuenta")
        
        # Verificar que quede al menos un admin
        if user.rol.nombre == "ADMIN":
            admin_count = Usuario.query.join(RolUsuario).filter(
                RolUsuario.nombre == "ADMIN",
                Usuario.activo == True
            ).count()
            if admin_count <= 1:
                raise Exception("Debe quedar al menos un administrador en el sistema")

        user.soft_delete(current_user_id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise Exception("Error al eliminar usuario")

    # -------------------------
    # CRUD Usuarios
    # -------------------------
    
    @staticmethod
    def get_all_users():
        """Obtener todos los usuarios activos"""
        return Usuario.query.filter(
            Usuario.activo == True,
            Usuario.deleted_at.is_(None)
        ).all()
    
    @staticmethod
    def get_user_by_id(user_id: int):
        """Obtener un usuario por ID"""
        return AuthService._get_user_or_error(user_id)
    
    @staticmethod
    def update_user(user_id: int, data: dict, current_user_id: int):
        """Actualizar datos de un usuario"""
        user = AuthService._get_user_or_error(user_id, solo_activos=True)
        requested_rol_id = data.get("rol_id")
        requested_rol_name = data.get("rol")
        requested_rol = None

        if requested_rol_id is not None:
            requested_rol = db.session.get(RolUsuario, requested_rol_id)
            if not requested_rol:
                raise Exception("Rol invalido")
        elif requested_rol_name is not None:
            requested_rol = RolUsuario.query.filter_by(nombre=requested_rol_name).first()
            if not requested_rol:
                raise Exception("Rol invalido")

        changes_role = requested_rol is not None and requested_rol.id != user.id_rol
        
        # Evitar que un admin se desactive a sí mismo
        if user_id == current_user_id and data.get("activo") == False:
            raise Exception("No puede desactivar su propia cuenta")

        if user_id == current_user_id and changes_role:
            raise Exception("No puede cambiar el rol de su propia cuenta")
        
        # Verificar que quede al menos un admin si se desactiva un admin
        should_check_last_admin = user.rol.nombre == "ADMIN" and (
            data.get("activo") == False
            or changes_role
        )
        if should_check_last_admin:
            admin_count = Usuario.query.join(RolUsuario).filter(
                RolUsuario.nombre == "ADMIN",
                Usuario.activo == True
            ).count()
            if admin_count <= 1:
                raise Exception("Debe quedar al menos un administrador en el sistema")
        
        # Actualizar campos permitidos
        if requested_rol is not None:
            user.id_rol = requested_rol.id
        
        if "nombre_usuario" in data:
            nombre_usuario = (data["nombre_usuario"] or "").strip()
            if not nombre_usuario:
                raise Exception("El nombre de usuario es obligatorio")

            existing = Usuario.query.filter(
                Usuario.nombre_usuario == nombre_usuario,
                Usuario.id != user_id
            ).first()
            if existing:
                raise Exception("El nombre de usuario ya esta en uso")

            user.nombre_usuario = nombre_usuario

        if "mail" in data:
            mail = (data["mail"] or "").strip()
            if not mail:
                raise Exception("El mail es obligatorio")

            # Verificar que el mail no exista
            existing = Usuario.query.filter(
                Usuario.mail == mail,
                Usuario.id != user_id
            ).first()
            if existing:
                raise Exception("El mail ya está en uso")
            user.mail = mail
        
        if "activo" in data:
            user.activo = data["activo"]
        
        try:
            db.session.commit()
            return user
        except Exception:
            db.session.rollback()
            raise Exception("Error al actualizar usuario")

    @staticmethod
    def get_rol_by_name(nombre: str):
        """Obtener un rol por nombre"""
        return RolUsuario.query.filter_by(nombre=nombre).first()

    @staticmethod
    def get_rol_by_id(rol_id: int):
        """Obtener un rol por ID"""
        return db.session.get(RolUsuario, rol_id)
