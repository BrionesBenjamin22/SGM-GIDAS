"""add equipamiento snapshot for memoria

Revision ID: f1b7c3d9e4a2
Revises: e6a1d4c8b2f7
Create Date: 2026-04-23 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f1b7c3d9e4a2"
down_revision = "e6a1d4c8b2f7"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "equipamiento_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("equipamiento_id", sa.Integer(), nullable=False),
        sa.Column("denominacion", sa.Text(), nullable=False),
        sa.Column("descripcion_breve", sa.Text(), nullable=False),
        sa.Column("fecha_incorporacion", sa.Date(), nullable=False),
        sa.Column("monto_invertido", sa.Float(), nullable=False),
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
        sa.ForeignKeyConstraint(["equipamiento_id"], ["equipamiento_grupo.id"]),
        sa.ForeignKeyConstraint(["grupo_utn_id"], ["grupo_utn.id"]),
        sa.ForeignKeyConstraint(["memoria_version_id"], ["memoria_version.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "equipamiento_id",
            name="uq_equipamiento_memoria_version"
        )
    )


def downgrade():
    op.drop_table("equipamiento_memoria_version")
