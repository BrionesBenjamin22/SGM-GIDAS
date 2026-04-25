"""add registro propiedad snapshot for memoria

Revision ID: f2c8d4a1b7e5
Revises: e7b3c1d5a9f4
Create Date: 2026-04-25 22:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "f2c8d4a1b7e5"
down_revision = "e7b3c1d5a9f4"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "registros_propiedad_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("registro_propiedad_id", sa.Integer(), nullable=False),
        sa.Column("nombre_articulo", sa.Text(), nullable=False),
        sa.Column("organismo_registrante", sa.Text(), nullable=False),
        sa.Column("fecha_registro", sa.Date(), nullable=False),
        sa.Column("tipo_registro_id", sa.Integer(), nullable=False),
        sa.Column("tipo_registro_nombre", sa.Text(), nullable=True),
        sa.Column("grupo_utn_id", sa.Integer(), nullable=False),
        sa.Column("grupo_utn_nombre", sa.String(length=255), nullable=True),
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
        sa.ForeignKeyConstraint(["registro_propiedad_id"], ["registros_patente_grupo.id"]),
        sa.ForeignKeyConstraint(["tipo_registro_id"], ["tipo_registro_propiedad.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "registro_propiedad_id",
            name="uq_registro_propiedad_memoria_version"
        )
    )


def downgrade():
    op.drop_table("registros_propiedad_memoria_version")
