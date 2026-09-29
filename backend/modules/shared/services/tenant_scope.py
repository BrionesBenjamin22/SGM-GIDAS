"""Request-scoped UCT isolation for ORM reads and writes.

The application currently has one loaded UCT per user. The scope is resolved
from active memberships in the database; request payloads and token claims do
not supply it. Shared catalogs are intentionally left outside this policy.
"""

from flask import g, has_request_context
from sqlalchemy import and_, event, exists, or_, select
from sqlalchemy.orm import Session, aliased, with_loader_criteria

from extension import db
from modules.shared.exceptions import ForbiddenError


GROUP_COLUMNS = ("grupo_utn_id", "grupo_id", "id_grupo_utn")
AUDIT_FKS = {"created_by", "updated_by", "deleted_by", "usuario_id"}
REVERSE_SCOPED_TABLES = {"usuario", "persona"}
GLOBAL_TABLES = {
    "auditoria_campo", "form_draft", "login_attempt", "refresh_token_session",
    "rol", "estado_memoria", "tipo_personal", "tipo_dedicacion",
    "tipo_formacion_becario", "categoria_utn", "fuente_financiamiento",
    "cargo", "tipo_visita", "programa_incentivos_investigador",
    "tipo_proyecto_investigacion", "rol_actividad_docencia", "grado_academico",
    "tipo_registro_propiedad", "tipo_reunion_cientifica", "tipo_revista",
    "tipo_erogacion", "categoria_erogacion", "tipo_contrato_transferencia",
}


def _classes_by_table():
    return {mapper.local_table.name: mapper.class_ for mapper in db.Model.registry.mappers}


def _predicate(model, group_id, classes, seen=frozenset()):
    table = model.__table__.name
    if table in seen or table in GLOBAL_TABLES:
        return None
    seen = seen | {table}

    if table == "grupo_utn":
        return model.id == group_id

    predicates = [getattr(model, name) == group_id for name in GROUP_COLUMNS
                  if name in model.__table__.columns]

    # Users and identities contain personal data; only members of this UCT
    # may appear in administration and audit relationships.
    if table == "usuario":
        membership = classes["usuario_grupo_utn"]
        predicates.append(exists(select(membership.id).where(
            membership.usuario_id == model.id,
            membership.grupo_utn_id == group_id,
            membership.activo.is_(True),
            membership.deleted_at.is_(None),
        )))
    elif table == "persona":
        user = classes["usuario"]
        user_predicate = _predicate(user, group_id, classes, seen)
        predicates.append(exists(select(user.id).where(
            user.id_persona == model.id, user_predicate,
        )))
    elif table == "identidad_personal":
        owners = [classes[name] for name in ("personal", "becario", "investigador")]
        predicates.append(or_(*(exists(select(owner.id).where(
            owner.identidad_id == model.id,
            owner.grupo_utn_id == group_id,
        )) for owner in owners)))

    parent_columns = []
    for column in model.__table__.columns:
        if column.name in AUDIT_FKS:
            continue
        for foreign_key in column.foreign_keys:
            parent = classes.get(foreign_key.column.table.name)
            if (parent is None or parent is model
                    or parent.__table__.name in REVERSE_SCOPED_TABLES):
                continue
            parent_alias = aliased(parent)
            parent_predicate = _predicate(parent_alias, group_id, classes, seen)
            if parent_predicate is None:
                continue
            column_ref = getattr(model, column.name)
            parent_columns.append(column_ref)
            parent_id = getattr(parent_alias, foreign_key.column.name)
            allowed_parent = select(parent_id).where(parent_predicate)
            predicate = column_ref.in_(allowed_parent)
            if column.nullable:
                predicate = or_(column_ref.is_(None), predicate)
            predicates.append(predicate)

    if parent_columns and not any(name in model.__table__.columns for name in GROUP_COLUMNS):
        predicates.append(or_(*(column.is_not(None) for column in parent_columns)))

    return and_(*predicates) if predicates else None


def register_tenant_orm_policy():
    """Install once per process; the group value is read anew per request."""
    if getattr(register_tenant_orm_policy, "installed", False):
        return

    @event.listens_for(Session, "do_orm_execute")
    def scope_reads(state):
        if not state.is_select:
            return
        if not has_request_context():
            return
        group_id = getattr(g, "current_grupo_utn_id", None)
        if group_id is None:
            return
        classes = _classes_by_table()
        statement = state.statement
        for model in classes.values():
            table = model.__table__.name
            if table == "grupo_utn":
                statement = statement.options(with_loader_criteria(
                    model, model.id == group_id,
                ))
                continue
            for name in GROUP_COLUMNS:
                if name in model.__table__.columns:
                    criterion = (_predicate(model, group_id, classes)
                                 if "memoria_version_id" in model.__table__.columns
                                 else getattr(model, name) == group_id)
                    statement = statement.options(with_loader_criteria(
                        model, criterion,
                    ))
                    break
        for table in ("memoria_version",):
            model = classes[table]
            predicate = _predicate(model, group_id, classes)
            statement = statement.options(with_loader_criteria(model, predicate))
        for description in getattr(statement, "column_descriptions", ()):
            model = description.get("entity")
            if model is None or not hasattr(model, "__table__"):
                continue
            predicate = _predicate(model, group_id, classes)
            if predicate is not None:
                statement = statement.where(predicate)
        state.statement = statement

    @event.listens_for(Session, "before_flush")
    def scope_writes(session, flush_context, instances):
        if not has_request_context():
            return
        group_id = getattr(g, "current_grupo_utn_id", None)
        if group_id is None:
            return
        classes = _classes_by_table()
        for instance in session.new | session.dirty | session.deleted:
            columns = instance.__table__.columns
            for name in GROUP_COLUMNS:
                if name not in columns:
                    continue
                value = getattr(instance, name)
                if instance in session.new and value is None:
                    setattr(instance, name, group_id)
                elif value != group_id:
                    raise ForbiddenError("La informacion pertenece a otra UCT.")
            if instance.__table__.name in {"usuario", "persona", "usuario_grupo_utn"}:
                continue
            for column in columns:
                if column.name in AUDIT_FKS or not column.foreign_keys:
                    continue
                value = getattr(instance, column.name)
                if value is None:
                    continue
                for foreign_key in column.foreign_keys:
                    parent = classes.get(foreign_key.column.table.name)
                    if (parent is None or parent is type(instance)
                            or parent.__table__.name in REVERSE_SCOPED_TABLES):
                        continue
                    parent_predicate = _predicate(parent, group_id, classes)
                    if parent_predicate is None:
                        continue
                    parent_id = getattr(parent, foreign_key.column.name)
                    if session.execute(select(parent_id).where(
                        parent_id == value, parent_predicate,
                    )).scalar_one_or_none() is None:
                        raise ForbiddenError("La relacion pertenece a otra UCT.")

    register_tenant_orm_policy.installed = True
