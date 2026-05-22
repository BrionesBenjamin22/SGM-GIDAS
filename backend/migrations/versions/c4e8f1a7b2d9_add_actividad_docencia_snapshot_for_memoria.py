"""add actividad docencia snapshot for memoria

Revision ID: c4e8f1a7b2d9
Revises: b3d7e2f4a9c1
Create Date: 2026-04-23 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c4e8f1a7b2d9"
down_revision = "b3d7e2f4a9c1"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "actividad_docencia_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("memoria_version_id", sa.Integer(), nullable=False),
        sa.Column("actividad_docencia_id", sa.Integer(), nullable=False),
        sa.Column("curso", sa.Text(), nullable=False),
        sa.Column("institucion", sa.Text(), nullable=False),
        sa.Column("fecha_inicio", sa.Date(), nullable=False),
        sa.Column("fecha_fin", sa.Date(), nullable=False),
        sa.Column("investigador_id", sa.Integer(), nullable=False),
        sa.Column("investigador_nombre", sa.String(length=255), nullable=True),
        sa.Column("rol_actividad_id", sa.Integer(), nullable=True),
        sa.Column("rol_actividad_nombre", sa.String(length=255), nullable=True),
        sa.Column("grado_academico_id", sa.Integer(), nullable=True),
        sa.Column("grado_academico_nombre", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["actividad_docencia_id"], ["actividad_y_catedra_posgrado.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["grado_academico_id"], ["grado_academico.id"]),
        sa.ForeignKeyConstraint(["investigador_id"], ["investigador.id"]),
        sa.ForeignKeyConstraint(["memoria_version_id"], ["memoria_version.id"]),
        sa.ForeignKeyConstraint(["rol_actividad_id"], ["rol_actividad_docencia.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "memoria_version_id",
            "actividad_docencia_id",
            name="uq_actividad_docencia_memoria_version"
        )
    )

    op.create_table(
        "actividad_docencia_grado_memoria_version",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "actividad_docencia_memoria_version_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column("investigador_actividad_grado_id", sa.Integer(), nullable=False),
        sa.Column("investigador_id", sa.Integer(), nullable=False),
        sa.Column("grado_academico_id", sa.Integer(), nullable=False),
        sa.Column("grado_academico_nombre", sa.String(length=255), nullable=True),
        sa.Column("fecha_inicio", sa.Date(), nullable=False),
        sa.Column("fecha_fin", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("deleted_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["actividad_docencia_memoria_version_id"],
            ["actividad_docencia_memoria_version.id"]
        ),
        sa.ForeignKeyConstraint(["created_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["deleted_by"], ["usuario.id"]),
        sa.ForeignKeyConstraint(
            ["grado_academico_id"],
            ["grado_academico.id"]
        ),
        sa.ForeignKeyConstraint(["investigador_id"], ["investigador.id"]),
        sa.ForeignKeyConstraint(
            ["investigador_actividad_grado_id"],
            ["investigador_actividad_grado.id"]
        ),
        sa.ForeignKeyConstraint(["updated_by"], ["usuario.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "actividad_docencia_memoria_version_id",
            "investigador_actividad_grado_id",
            name="uq_actividad_docencia_grado_memoria_version"
        )
    )


def downgrade():
    op.drop_table("actividad_docencia_grado_memoria_version")
    op.drop_table("actividad_docencia_memoria_version")
