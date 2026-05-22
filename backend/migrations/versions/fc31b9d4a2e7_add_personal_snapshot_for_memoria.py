"""add personal snapshot for memoria

Revision ID: fc31b9d4a2e7
Revises: f8a6d3c2b1e4
Create Date: 2026-04-23 22:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "fc31b9d4a2e7"
down_revision = "f8a6d3c2b1e4"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "personal_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("personal_id", sa.Integer(), nullable=False),
        sa.Column("nombre_apellido", sa.String(length=120), nullable=False),
        sa.Column("horas_semanales", sa.Integer(), nullable=False),
        sa.Column("tipo_personal_id", sa.Integer(), nullable=False),
        sa.Column("tipo_personal_nombre", sa.String(length=100), nullable=True),
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
        sa.ForeignKeyConstraint(["personal_id"], ["personal.id"]),
        sa.ForeignKeyConstraint(["tipo_personal_id"], ["tipo_personal.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "personal_id",
            name="uq_personal_memoria_version"
        )
    )


def downgrade():
    op.drop_table("personal_memoria_version")
