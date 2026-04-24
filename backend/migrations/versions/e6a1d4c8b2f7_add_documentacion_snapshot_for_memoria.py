"""add documentacion snapshot for memoria

Revision ID: e6a1d4c8b2f7
Revises: d5f9a2c4b7e1
Create Date: 2026-04-23 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e6a1d4c8b2f7"
down_revision = "d5f9a2c4b7e1"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "documentacion_bibliografica_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("documentacion_bibliografica_id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.Text(), nullable=False),
        sa.Column("editorial", sa.Text(), nullable=False),
        sa.Column("anio", sa.Integer(), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("grupo_id", sa.Integer(), nullable=False),
        sa.Column("grupo_nombre", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["documentacion_bibliografica_id"], ["documentacion_bibliografica.id"]),
        sa.ForeignKeyConstraint(["grupo_id"], ["grupo_utn.id"]),
        sa.ForeignKeyConstraint(["memoria_version_id"], ["memoria_version.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "documentacion_bibliografica_id",
            name="uq_documentacion_memoria_version"
        )
    )

    op.create_table(
        "documentacion_bibliografica_autor_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("documentacion_memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("autor_id", sa.Integer(), nullable=False),
        sa.Column("nombre_apellido", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["autor_id"], ["autor.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(
            ["documentacion_memoria_version_id"],
            ["documentacion_bibliografica_memoria_version.id"]
        ),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "documentacion_memoria_version_id",
            "autor_id",
            name="uq_documentacion_autor_memoria_version"
        )
    )


def downgrade():
    op.drop_table("documentacion_bibliografica_autor_memoria_version")
    op.drop_table("documentacion_bibliografica_memoria_version")
