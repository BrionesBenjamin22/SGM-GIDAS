"""add distincion snapshot for memoria

Revision ID: e7b3c1d5a9f4
Revises: d4f1a8c2b6e3
Create Date: 2026-04-25 21:35:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "e7b3c1d5a9f4"
down_revision = "d4f1a8c2b6e3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "distincion_recibida_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("distincion_id", sa.Integer(), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=False),
        sa.Column("proyecto_investigacion_id", sa.Integer(), nullable=True),
        sa.Column("proyecto_codigo", sa.Integer(), nullable=True),
        sa.Column("proyecto_nombre", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["distincion_id"], ["distincion_recibida.id"]),
        sa.ForeignKeyConstraint(["memoria_version_id"], ["memoria_version.id"]),
        sa.ForeignKeyConstraint(["proyecto_investigacion_id"], ["proyecto_investigacion.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "distincion_id",
            name="uq_distincion_memoria_version"
        )
    )


def downgrade():
    op.drop_table("distincion_recibida_memoria_version")
