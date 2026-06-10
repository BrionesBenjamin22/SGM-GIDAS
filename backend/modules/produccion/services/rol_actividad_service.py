from core.models.actividad_docencia import RolActividad
from extension import db
from sqlalchemy import func


class RolActividadService:

    @staticmethod
    def _validar_id(rol_id: int):
        if isinstance(rol_id, bool) or not isinstance(rol_id, int) or rol_id <= 0:
            raise ValueError("El id debe ser un entero positivo")
        return rol_id

    @staticmethod
    def _validar_payload(data: dict):
        if data is None or not isinstance(data, dict) or not data:
            raise ValueError("Los datos no pueden estar vacios")
        return data

    @staticmethod
    def _validar_nombre(nombre: str, rol_id: int = None):
        if nombre is None:
            raise ValueError("El nombre es obligatorio")

        if not isinstance(nombre, str):
            raise ValueError("El nombre debe ser texto")

        nombre = nombre.strip()
        if not nombre:
            raise ValueError("El nombre no puede estar vacio")

        if len(nombre) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")

        query = RolActividad.query.filter(
            func.lower(RolActividad.nombre) == nombre.lower()
        )

        if rol_id is not None:
            query = query.filter(RolActividad.id != rol_id)

        if query.first():
            raise ValueError("Ya existe un rol de actividad con ese nombre")

        return nombre

    @staticmethod
    def _get_or_404(rol_id: int):
        rol = RolActividad.query.get(RolActividadService._validar_id(rol_id))
        if not rol:
            raise ValueError("Rol de Actividad no encontrado")
        return rol

    @staticmethod
    def get_all():
        return [
            r.serialize()
            for r in RolActividad.query.order_by(RolActividad.nombre.asc()).all()
        ]

    @staticmethod
    def get_by_id(rol_id: int):
        rol = RolActividadService._get_or_404(rol_id)
        return rol.serialize()

    @staticmethod
    def create(data: dict):
        RolActividadService._validar_payload(data)
        nombre = RolActividadService._validar_nombre(data.get("nombre"))

        rol = RolActividad(nombre=nombre)
        db.session.add(rol)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return rol.serialize()

    @staticmethod
    def update(rol_id: int, data: dict):
        RolActividadService._validar_payload(data)
        rol = RolActividadService._get_or_404(rol_id)

        if "nombre" in data:
            rol.nombre = RolActividadService._validar_nombre(
                data.get("nombre"),
                rol_id=rol.id
            )

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return rol.serialize()

    @staticmethod
    def delete(rol_id: int):
        rol = RolActividadService._get_or_404(rol_id)

        if rol.actividades_docencia:
            raise ValueError(
                "No se puede eliminar el rol de actividad porque tiene actividades asociadas"
            )

        db.session.delete(rol)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Eliminado correctamente"}
