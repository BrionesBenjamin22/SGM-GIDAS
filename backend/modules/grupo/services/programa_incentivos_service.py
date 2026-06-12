from extension import db
from sqlalchemy import func
from modules.grupo.models.programa_incentivos import ProgramaIncentivos
from modules.shared.services.catalogo_auditoria_service import CatalogoAuditoriaService


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


def crear_programa_incentivos(data, user_id=None):
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
    CatalogoAuditoriaService.marcar_creacion(nuevo, user_id)
    db.session.add(nuevo)

    try:
        db.session.commit()
        return nuevo
    except Exception:
        db.session.rollback()
        raise


def actualizar_programa_incentivos(id, data, user_id=None):
    programa = ProgramaIncentivos.query.get(id)
    if not programa:
        raise ValueError("Programa de incentivos no encontrado.")

    nombre = data.get("nombre")
    if not nombre or not isinstance(nombre, str):
        raise ValueError("El nombre debe ser un texto no vacío.")

    nombre = nombre.strip()
    if not nombre:
        raise ValueError("El nombre no puede estar vacío.")

    if programa.deleted_at is not None:
        raise ValueError("No se puede editar un programa de incentivos inactivo.")

    duplicado = ProgramaIncentivos.query.filter(
        ProgramaIncentivos.nombre == nombre,
        ProgramaIncentivos.id != id
    ).first()

    if duplicado:
        raise ValueError("Ya existe un programa de incentivos con ese nombre.")

    cambios = CatalogoAuditoriaService.construir_cambios(
        programa,
        {"nombre": nombre}
    )
    programa.nombre = nombre
    CatalogoAuditoriaService.marcar_actualizacion(programa, cambios, user_id)

    try:
        db.session.commit()
        return programa
    except Exception:
        db.session.rollback()
        raise


def eliminar_programa_incentivos(id, user_id=None):
    programa = ProgramaIncentivos.query.get(id)
    if not programa:
        raise ValueError("Programa de incentivos no encontrado.")

    if programa.investigadores.count() > 0:
        raise ValueError(
            "No se puede eliminar el programa porque está asociado a investigadores."
        )

    CatalogoAuditoriaService.marcar_baja(programa, user_id)
    try:
        db.session.commit()
        return programa
    except Exception:
        db.session.rollback()
        raise


def listar_programas_incentivos(activos="true"):
    query = ProgramaIncentivos.query
    if activos == "true":
        query = query.filter(ProgramaIncentivos.deleted_at.is_(None))
    elif activos == "false":
        query = query.filter(ProgramaIncentivos.deleted_at.isnot(None))
    return query.order_by(ProgramaIncentivos.nombre.asc()).all()


def obtener_programa_incentivos_por_id(id):
    programa = ProgramaIncentivos.query.get(id)
    if not programa:
        raise ValueError("No se encontró un programa de incentivos con ese id.")
    return programa
