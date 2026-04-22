from extension import db
from sqlalchemy import func
from core.models.programa_incentivos import ProgramaIncentivos


def _validar_nombre(nombre, programa_id=None):
    if not isinstance(nombre, str):
        raise ValueError("El nombre debe ser un texto no vacio.")

    nombre = " ".join(nombre.strip().split())
    if not nombre:
        raise ValueError("El nombre no puede estar vacio.")

    query = ProgramaIncentivos.query.filter(
        func.lower(ProgramaIncentivos.nombre) == nombre.lower()
    )
    if programa_id is not None:
        query = query.filter(ProgramaIncentivos.id != programa_id)

    if query.first():
        raise ValueError("Ya existe un programa de incentivos con ese nombre.")

    return nombre


def crear_programa_incentivos(data):
    if not data:
        raise ValueError("Los datos no pueden estar vacíos.")

    nombre = data.get("nombre")
    if not nombre or not isinstance(nombre, str):
        raise ValueError("El nombre debe ser un texto no vacío.")

    nombre = nombre.strip()
    if not nombre:
        raise ValueError("El nombre no puede estar vacío.")

    if ProgramaIncentivos.query.filter_by(nombre=nombre).first():
        raise ValueError("Ya existe un programa de incentivos con ese nombre.")

    nuevo = ProgramaIncentivos(nombre=nombre)
    db.session.add(nuevo)

    try:
        db.session.commit()
        return nuevo
    except Exception:
        db.session.rollback()
        raise


def actualizar_programa_incentivos(id, data):
    programa = ProgramaIncentivos.query.get(id)
    if not programa:
        raise ValueError("Programa de incentivos no encontrado.")

    nombre = data.get("nombre")
    if not nombre or not isinstance(nombre, str):
        raise ValueError("El nombre debe ser un texto no vacío.")

    nombre = nombre.strip()
    if not nombre:
        raise ValueError("El nombre no puede estar vacío.")

    duplicado = ProgramaIncentivos.query.filter(
        ProgramaIncentivos.nombre == nombre,
        ProgramaIncentivos.id != id
    ).first()

    if duplicado:
        raise ValueError("Ya existe un programa de incentivos con ese nombre.")

    programa.nombre = nombre

    try:
        db.session.commit()
        return programa
    except Exception:
        db.session.rollback()
        raise


def eliminar_programa_incentivos(id):
    programa = ProgramaIncentivos.query.get(id)
    if not programa:
        raise ValueError("Programa de incentivos no encontrado.")

    if programa.investigadores.count() > 0:
        raise ValueError(
            "No se puede eliminar el programa porque está asociado a investigadores."
        )

    db.session.delete(programa)
    try:
        db.session.commit()
        return programa
    except Exception:
        db.session.rollback()
        raise


def listar_programas_incentivos():
    return ProgramaIncentivos.query.all()


def obtener_programa_incentivos_por_id(id):
    programa = ProgramaIncentivos.query.get(id)
    if not programa:
        raise ValueError("No se encontró un programa de incentivos con ese id.")
    return programa
