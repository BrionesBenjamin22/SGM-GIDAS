from core.models.documentacion_autores import DocumentacionBibliografica, Autor
from extension import db


class AutorService:

    # =========================
    # Helpers
    # =========================

    @staticmethod
    def _validar_payload(data: dict):
        if not isinstance(data, dict) or not data:
            raise Exception("Los datos no pueden estar vacios")

    @staticmethod
    def _validar_id(valor, campo: str):
        if not isinstance(valor, int) or valor <= 0:
            raise Exception(f"El campo '{campo}' debe ser un entero positivo")
        return valor

    @staticmethod
    def _validar_nombre(nombre: str):
        if not nombre or not isinstance(nombre, str) or not nombre.strip():
            raise Exception("El nombre es obligatorio")
        return nombre.strip()

    @staticmethod
    def _get_or_404(autor_id: int):
        autor = db.session.get(Autor, AutorService._validar_id(autor_id, "autor_id"))
        if not autor:
            raise Exception("Autor no encontrado")
        return autor

    # =========================
    # CRUD
    # =========================

    @staticmethod
    def get_all():
        autores = Autor.query.order_by(Autor.nombre_apellido.asc()).all()
        return [a.serialize() for a in autores]

    @staticmethod
    def get_by_id(autor_id: int):
        autor = AutorService._get_or_404(autor_id)
        return autor.serialize()

    @staticmethod
    def create(data: dict):
        AutorService._validar_payload(data)
        nombre = AutorService._validar_nombre(data.get("nombre_apellido"))

        existente = (
            Autor.query
            .filter(Autor.nombre_apellido == nombre)
            .first()
        )

        if existente:
            raise Exception("Ya existe un autor con ese nombre")

        autor = Autor(nombre_apellido=nombre)

        db.session.add(autor)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return autor.serialize()

    @staticmethod
    def update(autor_id: int, data: dict):
        AutorService._validar_payload(data)
        autor = AutorService._get_or_404(autor_id)

        if "nombre_apellido" in data:
            nombre = AutorService._validar_nombre(data["nombre_apellido"])

            existente = (
                Autor.query
                .filter(
                    Autor.nombre_apellido == nombre,
                    Autor.id != autor.id
                )
                .first()
            )

            if existente:
                raise Exception("Ya existe un autor con ese nombre")

            autor.nombre_apellido = nombre

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return autor.serialize()

    @staticmethod
    def delete(autor_id: int):
        autor = AutorService._get_or_404(autor_id)

        if autor.libros:
            raise Exception("No se puede eliminar un autor con libros asociados")

        db.session.delete(autor)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Autor eliminado correctamente"}

    # =========================
    # RELACION AUTOR - LIBRO
    # =========================

    @staticmethod
    def add_libro(autor_id: int, libro_id: int):
        autor = AutorService._get_or_404(autor_id)

        libro = db.session.get(
            DocumentacionBibliografica,
            AutorService._validar_id(libro_id, "libro_id")
        )
        if not libro or libro.deleted_at is not None:
            raise Exception("Libro no encontrado")

        if libro in autor.libros:
            raise Exception("El libro ya esta asociado a este autor")

        autor.libros.append(libro)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return autor.serialize()

    @staticmethod
    def remove_libro(autor_id: int, libro_id: int):
        autor = AutorService._get_or_404(autor_id)

        libro = db.session.get(
            DocumentacionBibliografica,
            AutorService._validar_id(libro_id, "libro_id")
        )
        if not libro or libro.deleted_at is not None:
            raise Exception("Libro no encontrado")

        if libro not in autor.libros:
            raise Exception("La relacion no existe")

        autor.libros.remove(libro)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return autor.serialize()
