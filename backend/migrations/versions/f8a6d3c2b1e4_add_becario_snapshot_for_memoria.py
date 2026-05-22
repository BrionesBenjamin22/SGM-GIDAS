"""add becario snapshot for memoria

Revision ID: f8a6d3c2b1e4
Revises: a926309b22a2
Create Date: 2026-04-23 21:15:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "f8a6d3c2b1e4"
down_revision = "a926309b22a2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "becario_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("becario_id", sa.Integer(), nullable=False),
        sa.Column("nombre_apellido", sa.String(length=120), nullable=False),
        sa.Column("horas_semanales", sa.Integer(), nullable=False),
        sa.Column("tipo_formacion_id", sa.Integer(), nullable=False),
        sa.Column("tipo_formacion_nombre", sa.String(length=100), nullable=True),
        sa.Column("grupo_utn_id", sa.Integer(), nullable=True),
        sa.Column("grupo_utn_nombre", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["becario_id"], ["becario.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["grupo_utn_id"], ["grupo_utn.id"]),
        sa.ForeignKeyConstraint(["memoria_version_id"], ["memoria_version.id"]),
        sa.ForeignKeyConstraint(["tipo_formacion_id"], ["tipo_formacion_becario.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "becario_id",
            name="uq_becario_memoria_version"
        )
    )


def downgrade():
    op.drop_table("becario_memoria_version")
