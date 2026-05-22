"""add trabajo reunion snapshot for memoria

Revision ID: c9e4b1d7a2f5
Revises: b8d2f4c1e6a9
Create Date: 2026-04-25 20:40:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "c9e4b1d7a2f5"
down_revision = "b8d2f4c1e6a9"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "trabajo_reunion_cientifica_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("trabajo_reunion_id", sa.Integer(), nullable=False),
        sa.Column("titulo_trabajo", sa.Text(), nullable=False),
        sa.Column("nombre_reunion", sa.Text(), nullable=False),
        sa.Column("procedencia", sa.Text(), nullable=False),
        sa.Column("fecha_inicio", sa.Date(), nullable=False),
        sa.Column("tipo_reunion_id", sa.Integer(), nullable=False),
        sa.Column("tipo_reunion_nombre", sa.String(length=100), nullable=True),
        sa.Column("grupo_utn_id", sa.Integer(), nullable=True),
        sa.Column("grupo_utn_nombre", sa.String(length=255), nullable=True),
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
        sa.ForeignKeyConstraint(["trabajo_reunion_id"], ["trabajo_reunion_cientifica.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "trabajo_reunion_id",
            name="uq_trabajo_reunion_memoria_version"
        )
    )


def downgrade():
    op.drop_table("trabajo_reunion_cientifica_memoria_version")
