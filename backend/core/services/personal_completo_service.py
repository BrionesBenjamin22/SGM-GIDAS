from sqlalchemy import or_

from core.models.personal import Personal, Becario, Investigador


# =====================================================
# LISTAR
# =====================================================

def _aplicar_filtro_activos(query, model, activos: str):
    if activos is None:
        activos = "true"

    activos = str(activos).strip().lower()

    if activos == "true":
        return query.filter(
            model.deleted_at.is_(None),
            model.activo.is_(True)
        )
    if activos == "false":
        return query.filter(
            or_(
                model.deleted_at.isnot(None),
                model.activo.is_(False)
            )
        )
    if activos == "all":
        return query
    return query.filter(
        model.deleted_at.is_(None),
        model.activo.is_(True)
    )


def _obtener_modelo_por_rol(rol: str):
    rol = rol.lower()

    if rol == "personal":
        return Personal
    if rol == "becario":
        return Becario
    if rol == "investigador":
        return Investigador

    return None


def listar_personal_completo(activos: str = "true"):

    resultado = []

    # --------------------
    # PERSONAL
    # --------------------
    for p in _aplicar_filtro_activos(Personal.query, Personal, activos).all():

        base = p.serialize()

        resultado.append({
            **base,
            "rol": "personal"
        })

    # --------------------
    # BECARIOS
    # --------------------
    for b in _aplicar_filtro_activos(Becario.query, Becario, activos).all():

        base = b.serialize()

        resultado.append({
            **base,
            "rol": "becario"
        })

    # --------------------
    # INVESTIGADORES
    # --------------------
    for i in _aplicar_filtro_activos(
        Investigador.query, Investigador, activos
    ).all():

        base = i.serialize()

        resultado.append({
            **base,
            "rol": "investigador"
        })

    return resultado


# =====================================================
# OBTENER POR TIPO
# =====================================================

def obtener_personal_por_tipo(rol, id):
    modelo = _obtener_modelo_por_rol(rol)
    if modelo is None:
        return None

    obj = modelo.query.get(id)

    if not obj:
        return None

    return obj.serialize()
