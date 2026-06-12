from extension import db
from core.models.categoria_utn import CategoriaUtn
from core.services.catalogo_auditoria_service import CatalogoAuditoriaService


def crear_categoria_utn(data, user_id=None):
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
    CatalogoAuditoriaService.marcar_creacion(nueva_categoria, user_id)
    db.session.add(nueva_categoria)

    try:
        db.session.commit()
        return nueva_categoria
    except Exception:
        db.session.rollback()
        raise


def actualizar_categoria_utn(id, data, user_id=None):
    categoria = CategoriaUtn.query.get(id)
    if not categoria:
        raise ValueError("Categoría UTN no encontrada.")

    nombre = data.get("nombre")
    if not nombre or not isinstance(nombre, str):
        raise ValueError("El nombre debe ser un texto no vacío.")

    nombre = nombre.strip()
    if not nombre:
        raise ValueError("El nombre no puede estar vacío.")

    if categoria.deleted_at is not None:
        raise ValueError("No se puede editar una categoria UTN inactiva.")

    duplicado = CategoriaUtn.query.filter(
        CategoriaUtn.nombre == nombre,
        CategoriaUtn.id != id
    ).first()

    if duplicado:
        raise ValueError("Ya existe una categoría con ese nombre.")

    cambios = CatalogoAuditoriaService.construir_cambios(
        categoria,
        {"nombre": nombre}
    )
    categoria.nombre = nombre
    CatalogoAuditoriaService.marcar_actualizacion(categoria, cambios, user_id)

    try:
        db.session.commit()
        return categoria
    except Exception:
        db.session.rollback()
        raise


def eliminar_categoria_utn(id, user_id=None):
    categoria = CategoriaUtn.query.get(id)
    if not categoria:
        raise ValueError("Categoría UTN no encontrada.")

    if categoria.investigadores.count() > 0:
        raise ValueError(
            "No se puede eliminar la categoría porque está asociada a investigadores."
        )

    CatalogoAuditoriaService.marcar_baja(categoria, user_id)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def listar_categorias_utn(activos="true"):
    query = CategoriaUtn.query
    if activos == "true":
        query = query.filter(CategoriaUtn.deleted_at.is_(None))
    elif activos == "false":
        query = query.filter(CategoriaUtn.deleted_at.isnot(None))
    return query.order_by(CategoriaUtn.nombre.asc()).all()


def obtener_categoria_utn_por_id(id):
    categoria = CategoriaUtn.query.get(id)
    if not categoria:
        raise ValueError("No se encontró una categoría con ese id.")
    return categoria
