"""add transferencia snapshot for memoria

Revision ID: b8d2f4c1e6a9
Revises: a7c4e1d9b2f6
Create Date: 2026-04-25 20:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "b8d2f4c1e6a9"
down_revision = "a7c4e1d9b2f6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "transferencia_socio_productiva_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("transferencia_id", sa.Integer(), nullable=False),
        sa.Column("numero_transferencia", sa.Integer(), nullable=False),
        sa.Column("denominacion", sa.Text(), nullable=False),
        sa.Column("demandante", sa.Text(), nullable=False),
        sa.Column("descripcion_actividad", sa.Text(), nullable=False),
        sa.Column("monto", sa.Float(), nullable=True),
        sa.Column("fecha_inicio", sa.Date(), nullable=False),
        sa.Column("fecha_fin", sa.Date(), nullable=True),
        sa.Column("tipo_contrato_id", sa.Integer(), nullable=False),
        sa.Column("tipo_contrato_nombre", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(["tipo_contrato_id"], ["tipo_contrato_transferencia.id"]),
        sa.ForeignKeyConstraint(["transferencia_id"], ["transferencia_socio_productiva.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "transferencia_id",
            name="uq_transferencia_memoria_version"
        )
    )

    op.create_table(
        "adoptante_transferencia_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("transferencia_memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("adoptante_transferencia_id", sa.Integer(), nullable=False),
        sa.Column("adoptante_id", sa.Integer(), nullable=False),
        sa.Column("adoptante_nombre", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["adoptante_id"], ["adoptante.id"]),
        sa.ForeignKeyConstraint(["adoptante_transferencia_id"], ["adoptante_x_transferencia.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(
            ["transferencia_memoria_version_id"],
            ["transferencia_socio_productiva_memoria_version.id"]
        ),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "transferencia_memoria_version_id",
            "adoptante_transferencia_id",
            name="uq_adoptante_transferencia_memoria_version"
        )
    )


def downgrade():
    op.drop_table("adoptante_transferencia_memoria_version")
    op.drop_table("transferencia_socio_productiva_memoria_version")
