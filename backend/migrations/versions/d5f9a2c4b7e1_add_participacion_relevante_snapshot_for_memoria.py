"""add participacion relevante snapshot for memoria

Revision ID: d5f9a2c4b7e1
Revises: c4e8f1a7b2d9
Create Date: 2026-04-23 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d5f9a2c4b7e1"
down_revision = "c4e8f1a7b2d9"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "participacion_relevante_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("participacion_relevante_id", sa.Integer(), nullable=False),
        sa.Column("nombre_evento", sa.Text(), nullable=False),
        sa.Column("forma_participacion", sa.Text(), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("investigador_id", sa.Integer(), nullable=False),
        sa.Column("investigador_nombre", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["investigador_id"], ["investigador.id"]),
        sa.ForeignKeyConstraint(["memoria_version_id"], ["memoria_version.id"]),
        sa.ForeignKeyConstraint(
            ["participacion_relevante_id"],
            ["participacion_relevante.id"]
        ),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "participacion_relevante_id",
            name="uq_participacion_relevante_memoria_version"
        )
    )


def downgrade():
    op.drop_table("participacion_relevante_memoria_version")
