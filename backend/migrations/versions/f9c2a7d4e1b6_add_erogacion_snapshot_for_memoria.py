"""add erogacion snapshot for memoria

Revision ID: f9c2a7d4e1b6
Revises: f1b7c3d9e4a2
Create Date: 2026-04-25 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f9c2a7d4e1b6"
down_revision = "f1b7c3d9e4a2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "erogacion_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("erogacion_id", sa.Integer(), nullable=False),
        sa.Column("numero_erogacion", sa.Integer(), nullable=True),
        sa.Column("egresos", sa.Float(), nullable=False),
        sa.Column("ingresos", sa.Float(), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("tipo_erogacion_id", sa.Integer(), nullable=False),
        sa.Column("tipo_erogacion_nombre", sa.Text(), nullable=True),
        sa.Column("fuente_financiamiento_id", sa.Integer(), nullable=False),
        sa.Column("fuente_financiamiento_nombre", sa.String(length=255), nullable=True),
        sa.Column("grupo_utn_id", sa.Integer(), nullable=False),
        sa.Column("grupo_utn_nombre", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["erogacion_id"], ["erogacion.id"]),
        sa.ForeignKeyConstraint(["fuente_financiamiento_id"], ["fuente_financiamiento.id"]),
        sa.ForeignKeyConstraint(["grupo_utn_id"], ["grupo_utn.id"]),
        sa.ForeignKeyConstraint(["memoria_version_id"], ["memoria_version.id"]),
        sa.ForeignKeyConstraint(["tipo_erogacion_id"], ["tipo_erogacion.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "erogacion_id",
            name="uq_erogacion_memoria_version"
        )
    )


def downgrade():
    op.drop_table("erogacion_memoria_version")
