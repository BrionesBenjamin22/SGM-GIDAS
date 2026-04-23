"""add investigador snapshot for memoria

Revision ID: f4b8c2d1e9a7
Revises: f2a1c9d4b7e3
Create Date: 2026-04-23 20:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f4b8c2d1e9a7"
down_revision = "f2a1c9d4b7e3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "investigador_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("investigador_id", sa.Integer(), nullable=False),
        sa.Column("nombre_apellido", sa.String(length=120), nullable=False),
        sa.Column("horas_semanales", sa.Integer(), nullable=False),
        sa.Column("tipo_dedicacion_id", sa.Integer(), nullable=True),
        sa.Column("tipo_dedicacion_nombre", sa.String(length=100), nullable=True),
        sa.Column("categoria_utn_id", sa.Integer(), nullable=True),
        sa.Column("categoria_utn_nombre", sa.String(length=100), nullable=True),
        sa.Column("programa_incentivos_id", sa.Integer(), nullable=True),
        sa.Column("programa_incentivos_nombre", sa.String(length=100), nullable=True),
        sa.Column("grupo_utn_id", sa.Integer(), nullable=True),
        sa.Column("grupo_utn_nombre", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["categoria_utn_id"], ["categoria_utn.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["grupo_utn_id"], ["grupo_utn.id"]),
        sa.ForeignKeyConstraint(["investigador_id"], ["investigador.id"]),
        sa.ForeignKeyConstraint(["memoria_version_id"], ["memoria_version.id"]),
        sa.ForeignKeyConstraint(
            ["programa_incentivos_id"],
            ["programa_incentivos_investigador.id"]
        ),
        sa.ForeignKeyConstraint(["tipo_dedicacion_id"], ["tipo_dedicacion.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "investigador_id",
            name="uq_investigador_memoria_version"
        )
    )


def downgrade():
    op.drop_table("investigador_memoria_version")
