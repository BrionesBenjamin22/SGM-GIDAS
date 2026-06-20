"""remove planificacion from proyecto

Revision ID: b3d7e2f4a9c1
Revises: fd62c4a1b9e8
Create Date: 2026-04-23 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b3d7e2f4a9c1"
down_revision = "fd62c4a1b9e8"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TABLE proyecto_investigacion "
        "DROP CONSTRAINT IF EXISTS proyecto_investigacion_planificacion_id_fkey"
    )
    op.execute(
        "ALTER TABLE proyecto_investigacion_memoria_version "
        "DROP CONSTRAINT IF EXISTS "
        "proyecto_investigacion_memoria_version_planificacion_id_fkey"
    )

    with op.batch_alter_table("proyecto_investigacion") as batch_op:
        batch_op.drop_column("planificacion_id")

    with op.batch_alter_table("proyecto_investigacion_memoria_version") as batch_op:
        batch_op.drop_column("planificacion_id")
        batch_op.drop_column("planificacion_descripcion")


def downgrade():
    with op.batch_alter_table("proyecto_investigacion") as batch_op:
        batch_op.add_column(
            sa.Column("planificacion_id", sa.Integer(), nullable=True)
        )
        batch_op.create_foreign_key(
            "proyecto_investigacion_planificacion_id_fkey",
            "planificacion_grupo",
            ["planificacion_id"],
            ["id"]
        )

    with op.batch_alter_table("proyecto_investigacion_memoria_version") as batch_op:
        batch_op.add_column(
            sa.Column("planificacion_descripcion", sa.Text(), nullable=True)
        )
        batch_op.add_column(
            sa.Column("planificacion_id", sa.Integer(), nullable=True)
        )
        batch_op.create_foreign_key(
            "proyecto_investigacion_memoria_version_planificacion_id_fkey",
            "planificacion_grupo",
            ["planificacion_id"],
            ["id"]
        )
