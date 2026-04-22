from extension import db
from sqlalchemy import func
from core.models.actividad_docencia import GradoAcademico


class GradoAcademicoService:

    @staticmethod
    def _validar_id(grado_id: int):
        if isinstance(grado_id, bool) or not isinstance(grado_id, int) or grado_id <= 0:
            raise ValueError("El id debe ser un entero positivo")
        return grado_id

    @staticmethod
    def _validar_payload(data: dict):
        if data is None or not isinstance(data, dict) or not data:
            raise ValueError("Los datos no pueden estar vacios")
        return data

    @staticmethod
    def _validar_nombre(nombre: str):
        if nombre is None:
            raise ValueError("El nombre es obligatorio")
        if not isinstance(nombre, str) or not nombre.strip():
            raise ValueError("El nombre es obligatorio")
        nombre = nombre.strip()
        if len(nombre) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return nombre

    @staticmethod
    def _get_or_404(grado_id: int):
        grado = GradoAcademico.query.get(GradoAcademicoService._validar_id(grado_id))
        if not grado:
            raise ValueError("Grado Academico no encontrado")
        return grado

    @staticmethod
    def get_all():
        return [g.serialize() for g in GradoAcademico.query.order_by(GradoAcademico.nombre.asc()).all()]

    @staticmethod
    def get_by_id(grado_id: int):
        grado = GradoAcademicoService._get_or_404(grado_id)
        return grado.serialize()

    @staticmethod
    def create(data: dict):
        GradoAcademicoService._validar_payload(data)
        nombre = GradoAcademicoService._validar_nombre(data.get("nombre"))

        existente = GradoAcademico.query.filter(
            func.lower(GradoAcademico.nombre) == nombre.lower()
        ).first()

        if existente:
            raise ValueError("Ya existe un grado academico con ese nombre")

        grado = GradoAcademico(nombre=nombre)
        db.session.add(grado)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return grado.serialize()

    @staticmethod
    def update(grado_id: int, data: dict):
        GradoAcademicoService._validar_payload(data)
        grado = GradoAcademicoService._get_or_404(grado_id)

        if "nombre" in data:
            nombre = GradoAcademicoService._validar_nombre(data["nombre"])

            existente = GradoAcademico.query.filter(
                func.lower(GradoAcademico.nombre) == nombre.lower(),
                GradoAcademico.id != grado.id
            ).first()

            if existente:
                raise ValueError("Ya existe un grado academico con ese nombre")

            grado.nombre = nombre

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return grado.serialize()

    @staticmethod
    def delete(grado_id: int):
        grado = GradoAcademicoService._get_or_404(grado_id)

        if grado.participaciones:
            raise ValueError(
                "No se puede eliminar el grado academico porque tiene actividades asociadas"
            )

        db.session.delete(grado)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Eliminado correctamente"}
