"""add audit fields to catalog tables

Revision ID: ab3c9d2e7f10
Revises: f2c8d4a1b7e5, c2f7a1d4b8e9
Create Date: 2026-06-10
"""

from alembic import op
import sqlalchemy as sa


revision = "ab3c9d2e7f10"
down_revision = ("f2c8d4a1b7e5", "c2f7a1d4b8e9")
branch_labels = None
depends_on = None


CATALOG_TABLES = [
    "categoria_utn",
    "fuente_financiamiento",
    "tipo_personal",
    "tipo_formacion_becario",
    "tipo_dedicacion",
    "tipo_proyecto_investigacion",
    "tipo_erogacion",
    "cargo",
    "programa_incentivos_investigador",
    "tipo_contrato_transferencia",
    "rol_actividad_docencia",
    "grado_academico",
    "tipo_registro_propiedad",
    "tipo_reunion_cientifica",
]


def _add_audit_columns(table_name):
    op.add_column(
        table_name,
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
    )
    op.add_column(table_name, sa.Column("updated_at", sa.DateTime(), nullable=True))
    op.add_column(table_name, sa.Column("deleted_at", sa.DateTime(), nullable=True))
    op.add_column(
        table_name,
        sa.Column("activo", sa.Boolean(), server_default=sa.true(), nullable=False),
    )
    op.add_column(table_name, sa.Column("created_by", sa.Integer(), nullable=True))
    op.add_column(table_name, sa.Column("updated_by", sa.Integer(), nullable=True))
    op.add_column(table_name, sa.Column("deleted_by", sa.Integer(), nullable=True))

    op.create_foreign_key(
        f"fk_{table_name}_created_by_usuario",
        table_name,
        "usuario",
        ["created_by"],
        ["id"],
    )
    op.create_foreign_key(
        f"fk_{table_name}_updated_by_usuario",
        table_name,
        "usuario",
        ["updated_by"],
        ["id"],
    )
    op.create_foreign_key(
        f"fk_{table_name}_deleted_by_usuario",
        table_name,
        "usuario",
        ["deleted_by"],
        ["id"],
    )


def _drop_audit_columns(table_name):
    op.drop_constraint(f"fk_{table_name}_deleted_by_usuario", table_name, type_="foreignkey")
    op.drop_constraint(f"fk_{table_name}_updated_by_usuario", table_name, type_="foreignkey")
    op.drop_constraint(f"fk_{table_name}_created_by_usuario", table_name, type_="foreignkey")

    op.drop_column(table_name, "deleted_by")
    op.drop_column(table_name, "updated_by")
    op.drop_column(table_name, "created_by")
    op.drop_column(table_name, "activo")
    op.drop_column(table_name, "deleted_at")
    op.drop_column(table_name, "updated_at")
    op.drop_column(table_name, "created_at")


def upgrade():
    for table_name in CATALOG_TABLES:
        _add_audit_columns(table_name)


def downgrade():
    for table_name in reversed(CATALOG_TABLES):
        _drop_audit_columns(table_name)
