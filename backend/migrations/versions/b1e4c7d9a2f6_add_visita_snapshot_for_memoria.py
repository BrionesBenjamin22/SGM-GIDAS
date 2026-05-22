"""add visita academica snapshot for memoria

Revision ID: b1e4c7d9a2f6
Revises: a1d9c4e7b2f8
Create Date: 2026-04-25 23:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "b1e4c7d9a2f6"
down_revision = "a1d9c4e7b2f8"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "visita_academica_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("visita_academica_id", sa.Integer(), nullable=False),
        sa.Column("razon", sa.Text(), nullable=False),
        sa.Column("procedencia", sa.Text(), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("tipo_visita_id", sa.Integer(), nullable=False),
        sa.Column("tipo_visita_nombre", sa.String(length=255), nullable=True),
        sa.Column("grupo_utn_id", sa.Integer(), nullable=False),
        sa.Column("grupo_utn_nombre", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["memoria_version_id"], ["memoria_version.id"]),
        sa.ForeignKeyConstraint(["visita_academica_id"], ["visita_grupo.id"]),
        sa.ForeignKeyConstraint(["tipo_visita_id"], ["tipo_reunion_cientifica.id"]),
        sa.ForeignKeyConstraint(["grupo_utn_id"], ["grupo_utn.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "visita_academica_id",
            name="uq_visita_academica_memoria_version"
        )
    )


def downgrade():
    op.drop_table("visita_academica_memoria_version")
