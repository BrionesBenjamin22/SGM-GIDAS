from extension import db
from core.models.fuente_financiamiento import FuenteFinanciamiento


def crear_fuente_financiamiento(data):
    if not data:
        raise ValueError("Los datos no pueden estar vacíos.")

    nombre_original = data.get("nombre")
    if not nombre_original or not isinstance(nombre_original, str):
        raise ValueError("El nombre debe ser un texto no vacío.")

    nombre_original = nombre_original.strip()
    if not nombre_original:
        raise ValueError("El nombre no puede estar vacío.")

    # Normalización SOLO para validar duplicados
    nombre_normalizado = nombre_original.lower()

    existe = FuenteFinanciamiento.query.filter(
        db.func.lower(FuenteFinanciamiento.nombre) == nombre_normalizado
    ).first()

    if existe:
        raise ValueError("Ya existe una fuente de financiamiento con ese nombre.")

    # Se guarda el nombre tal como lo escribió el usuario
    nueva = FuenteFinanciamiento(nombre=nombre_original)
    db.session.add(nueva)

    try:
        db.session.commit()
        return nueva
    except Exception:
        db.session.rollback()
        raise


def actualizar_fuente_financiamiento(id, data):
    fuente = FuenteFinanciamiento.query.get(id)
    if not fuente:
        raise ValueError("Fuente de financiamiento no encontrada.")

    nombre = data.get("nombre")
    if not nombre or not isinstance(nombre, str):
        raise ValueError("El nombre debe ser un texto no vacío.")

    nombre = nombre.strip().lower()
    if not nombre:
        raise ValueError("El nombre no puede estar vacío.")

    duplicado = FuenteFinanciamiento.query.filter(
        FuenteFinanciamiento.nombre == nombre,
        FuenteFinanciamiento.id != id
    ).first()

    if duplicado:
        raise ValueError("Ya existe una fuente de financiamiento con ese nombre.")

    fuente.nombre = nombre

    try:
        db.session.commit()
        return fuente
    except Exception:
        db.session.rollback()
        raise


def eliminar_fuente_financiamiento(id):
    fuente = FuenteFinanciamiento.query.get(id)
    if not fuente:
        raise ValueError("Fuente de financiamiento no encontrada.")

    if fuente.becarios.count() > 0:
        raise ValueError(
            "No se puede eliminar la fuente de financiamiento porque está asociada a becarios."
        )

    if fuente.proyectos_investigacion.count() > 0:
        raise ValueError(
            "No se puede eliminar la fuente de financiamiento porque está asociada a proyectos."
        )

    db.session.delete(fuente)
    try:
        db.session.commit()
        return fuente
    except Exception:
        db.session.rollback()
        raise


def listar_fuentes_financiamiento():
    return FuenteFinanciamiento.query.all()


def obtener_fuente_financiamiento_por_id(id):
    fuente = FuenteFinanciamiento.query.get(id)
    if not fuente:
        raise ValueError("No se encontró una fuente de financiamiento con ese id.")
    return fuente
