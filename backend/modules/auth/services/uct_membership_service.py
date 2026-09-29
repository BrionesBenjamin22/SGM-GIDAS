from extension import db
from modules.auth.models.usuario import Usuario
from modules.auth.models.usuario_grupo_utn import UsuarioGrupoUtn
from modules.grupo.models.grupo import GrupoInvestigacionUtn
from modules.shared.exceptions import NotFoundError


def _active_user(user_id: int) -> Usuario:
    user = db.session.get(Usuario, user_id)
    if user is None or not user.activo or user.deleted_at is not None:
        raise NotFoundError("Usuario no encontrado")
    return user


def allowed_ucts(user_id: int) -> list[dict]:
    """Resolve permissions from current database state, never from JWT claims."""
    user = _active_user(user_id)
    query = GrupoInvestigacionUtn.query.filter(
        GrupoInvestigacionUtn.activo.is_(True),
        GrupoInvestigacionUtn.deleted_at.is_(None),
    )
    query = query.join(
        UsuarioGrupoUtn,
        UsuarioGrupoUtn.grupo_utn_id == GrupoInvestigacionUtn.id,
    ).filter(
        UsuarioGrupoUtn.usuario_id == user.id,
        UsuarioGrupoUtn.activo.is_(True),
        UsuarioGrupoUtn.deleted_at.is_(None),
    )
    return [
        {"id": group.id, "nombre": group.nombre_sigla_grupo}
        for group in query.order_by(GrupoInvestigacionUtn.nombre_sigla_grupo.asc()).all()
    ]


def single_allowed_uct_id(user_id: int) -> int | None:
    """A user may work only when exactly one active UCT is assigned."""
    groups = allowed_ucts(user_id)
    if len(groups) == 1:
        return groups[0]["id"]
    return None
