"""add trabajo revista snapshot for memoria

Revision ID: d4f1a8c2b6e3
Revises: c9e4b1d7a2f5
Create Date: 2026-04-25 21:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "d4f1a8c2b6e3"
down_revision = "c9e4b1d7a2f5"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "trabajos_revista_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("trabajo_revista_id", sa.Integer(), nullable=False),
        sa.Column("titulo_trabajo", sa.Text(), nullable=False),
        sa.Column("nombre_revista", sa.Text(), nullable=False),
        sa.Column("editorial", sa.Text(), nullable=False),
        sa.Column("issn", sa.Text(), nullable=False),
        sa.Column("pais", sa.Text(), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("grupo_utn_id", sa.Integer(), nullable=True),
        sa.Column("grupo_utn_nombre", sa.String(length=255), nullable=True),
        sa.Column("tipo_reunion_id", sa.Integer(), nullable=False),
        sa.Column("tipo_reunion_nombre", sa.String(length=100), nullable=True),
        sa.Column("investigadores_participantes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["grupo_utn_id"], ["grupo_utn.id"]),
        sa.ForeignKeyConstraint(["memoria_version_id"], ["memoria_version.id"]),
        sa.ForeignKeyConstraint(["tipo_reunion_id"], ["tipo_reunion_cientifica.id"]),
        sa.ForeignKeyConstraint(["trabajo_revista_id"], ["trabajos_revista.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "trabajo_revista_id",
            name="uq_trabajo_revista_memoria_version"
        )
    )


def downgrade():
    op.drop_table("trabajos_revista_memoria_version")
