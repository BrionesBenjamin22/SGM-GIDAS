"""add articulo divulgacion snapshot for memoria

Revision ID: a1d9c4e7b2f8
Revises: f2c8d4a1b7e5
Create Date: 2026-04-25 22:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "a1d9c4e7b2f8"
down_revision = "f2c8d4a1b7e5"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "articulo_divulgacion_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("articulo_divulgacion_id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.Text(), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=False),
        sa.Column("fecha_publicacion", sa.Date(), nullable=False),
        sa.Column("grupo_utn_id", sa.Integer(), nullable=False),
        sa.Column("grupo_utn_nombre", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["articulo_divulgacion_id"], ["articulo_divulgacion.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["grupo_utn_id"], ["grupo_utn.id"]),
        sa.ForeignKeyConstraint(["memoria_version_id"], ["memoria_version.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "articulo_divulgacion_id",
            name="uq_articulo_divulgacion_memoria_version"
        )
    )


def downgrade():
    op.drop_table("articulo_divulgacion_memoria_version")
