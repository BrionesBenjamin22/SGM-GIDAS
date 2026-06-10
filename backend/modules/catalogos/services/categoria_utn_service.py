from extension import db
from core.models.categoria_utn import CategoriaUtn


def crear_categoria_utn(data):
    if not data:
        raise ValueError("Los datos no pueden estar vacíos.")

    nombre = data.get("nombre")
    if not nombre or not isinstance(nombre, str):
        raise ValueError("El nombre debe ser un texto no vacío.")

    nombre = nombre.strip()
    if not nombre:
        raise ValueError("El nombre no puede estar vacío.")

    if CategoriaUtn.query.filter_by(nombre=nombre).first():
        raise ValueError("Ya existe una categoría con ese nombre.")

    nueva_categoria = CategoriaUtn(nombre=nombre)
    db.session.add(nueva_categoria)

    try:
        db.session.commit()
        return nueva_categoria
    except Exception:
        db.session.rollback()
        raise


def actualizar_categoria_utn(id, data):
    categoria = CategoriaUtn.query.get(id)
    if not categoria:
        raise ValueError("Categoría UTN no encontrada.")

    nombre = data.get("nombre")
    if not nombre or not isinstance(nombre, str):
        raise ValueError("El nombre debe ser un texto no vacío.")

    nombre = nombre.strip()
    if not nombre:
        raise ValueError("El nombre no puede estar vacío.")

    duplicado = CategoriaUtn.query.filter(
        CategoriaUtn.nombre == nombre,
        CategoriaUtn.id != id
    ).first()

    if duplicado:
        raise ValueError("Ya existe una categoría con ese nombre.")

    categoria.nombre = nombre

    try:
        db.session.commit()
        return categoria
    except Exception:
        db.session.rollback()
        raise


def eliminar_categoria_utn(id):
    categoria = CategoriaUtn.query.get(id)
    if not categoria:
        raise ValueError("Categoría UTN no encontrada.")

    if categoria.investigadores.count() > 0:
        raise ValueError(
            "No se puede eliminar la categoría porque está asociada a investigadores."
        )

    db.session.delete(categoria)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def listar_categorias_utn():
    return CategoriaUtn.query.all()


def obtener_categoria_utn_por_id(id):
    categoria = CategoriaUtn.query.get(id)
    if not categoria:
        raise ValueError("No se encontró una categoría con ese id.")
    return categoria
