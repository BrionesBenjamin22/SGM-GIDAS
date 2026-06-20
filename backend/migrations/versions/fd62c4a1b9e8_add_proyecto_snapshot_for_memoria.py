"""add proyecto snapshot for memoria

Revision ID: fd62c4a1b9e8
Revises: fc31b9d4a2e7
Create Date: 2026-04-23 22:45:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "fd62c4a1b9e8"
down_revision = "fc31b9d4a2e7"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "proyecto_investigacion_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("proyecto_investigacion_id", sa.Integer(), nullable=False),
        sa.Column("codigo_proyecto", sa.Integer(), nullable=False),
        sa.Column("nombre_proyecto", sa.Text(), nullable=False),
        sa.Column("descripcion_proyecto", sa.Text(), nullable=False),
        sa.Column("fecha_inicio", sa.Date(), nullable=False),
        sa.Column("fecha_fin", sa.Date(), nullable=True),
        sa.Column("dificultades_proyecto", sa.Text(), nullable=True),
        sa.Column("monto_destinado", sa.Float(), nullable=True),
        sa.Column("tipo_proyecto_id", sa.Integer(), nullable=False),
        sa.Column("tipo_proyecto_nombre", sa.Text(), nullable=True),
        sa.Column("grupo_utn_id", sa.Integer(), nullable=True),
        sa.Column("grupo_utn_nombre", sa.String(length=255), nullable=True),
        sa.Column("fuente_financiamiento_id", sa.Integer(), nullable=True),
        sa.Column("fuente_financiamiento_nombre", sa.String(length=255), nullable=True),
        sa.Column("planificacion_id", sa.Integer(), nullable=True),
        sa.Column("planificacion_descripcion", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["fuente_financiamiento_id"], ["fuente_financiamiento.id"]),
        sa.ForeignKeyConstraint(["grupo_utn_id"], ["grupo_utn.id"]),
        sa.ForeignKeyConstraint(["memoria_version_id"], ["memoria_version.id"]),
        sa.ForeignKeyConstraint(["planificacion_id"], ["planificacion_grupo.id"]),
        sa.ForeignKeyConstraint(["proyecto_investigacion_id"], ["proyecto_investigacion.id"]),
        sa.ForeignKeyConstraint(["tipo_proyecto_id"], ["tipo_proyecto_investigacion.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "proyecto_investigacion_id",
            name="uq_proyecto_memoria_version"
        )
    )


def downgrade():
    op.drop_table("proyecto_investigacion_memoria_version")
