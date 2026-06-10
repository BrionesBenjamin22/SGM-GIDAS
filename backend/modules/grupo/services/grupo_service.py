from extension import db
from core.models.grupo import GrupoInvestigacionUtn


def crear_grupo_utn(data, user_id):
    if GrupoInvestigacionUtn.query.filter(
        GrupoInvestigacionUtn.deleted_at.is_(None)
    ).first():
        raise ValueError("Ya existe un grupo de investigación activo.")

    if not data:
        raise ValueError("Los datos no pueden estar vacíos.")

    campos = [
        "nombre_unidad_academica",
        "nombre_sigla_grupo",
        "mail",
        "objetivo_desarrollo"
    ]

    for campo in campos:
        if not data.get(campo):
            raise ValueError(f"El campo '{campo}' es obligatorio.")

    nuevo_grupo = GrupoInvestigacionUtn(
        nombre_unidad_academica=data["nombre_unidad_academica"].strip(),
        nombre_sigla_grupo=data["nombre_sigla_grupo"].strip(),
        mail=data["mail"].strip(),
        objetivo_desarrollo=data["objetivo_desarrollo"].strip(),
        created_by=user_id
    )

    db.session.add(nuevo_grupo)
    db.session.commit()

    return nuevo_grupo


def obtener_grupo_utn():
    return GrupoInvestigacionUtn.query.filter(
        GrupoInvestigacionUtn.deleted_at.is_(None)
    ).first()


def actualizar_grupo_utn(data):
    grupo = obtener_grupo_utn()
    if not grupo:
        raise ValueError("No existe grupo activo.")

    if not data:
        raise ValueError("Los datos no pueden estar vacíos.")

    for campo in [
        "mail",
        "nombre_unidad_academica",
        "objetivo_desarrollo",
        "nombre_sigla_grupo"
    ]:
        if campo in data:
            valor = data[campo]
            if not isinstance(valor, str) or not valor.strip():
                raise ValueError(f"El campo '{campo}' no puede estar vacío.")
            setattr(grupo, campo, valor.strip())

    db.session.commit()
    return grupo


def eliminar_grupo_utn(user_id):
    grupo = obtener_grupo_utn()

    if not grupo:
        raise ValueError("No hay grupo activo para eliminar.")

    grupo.soft_delete(user_id)

    db.session.commit()

    return {"message": "Grupo eliminado correctamente (soft delete)."}

def restaurar_grupo_utn():
    grupo = db.session.query(GrupoInvestigacionUtn).filter(
        GrupoInvestigacionUtn.deleted_at.isnot(None)
    ).first()

    if not grupo:
        raise ValueError("No existe grupo eliminado para restaurar.")

    grupo.restore()

    db.session.commit()

    return grupo