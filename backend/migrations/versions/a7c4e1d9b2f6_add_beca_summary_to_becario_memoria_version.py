"""add beca summary to becario memoria version

Revision ID: a7c4e1d9b2f6
Revises: f9c2a7d4e1b6
Create Date: 2026-04-25 19:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "a7c4e1d9b2f6"
down_revision = "f9c2a7d4e1b6"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("becario_memoria_version") as batch_op:
        batch_op.add_column(
            sa.Column("becas_percibidas", sa.Text(), nullable=True)
        )
        batch_op.add_column(
            sa.Column("fuentes_financiamiento_beca", sa.Text(), nullable=True)
        )


def downgrade():
    with op.batch_alter_table("becario_memoria_version") as batch_op:
        batch_op.drop_column("fuentes_financiamiento_beca")
        batch_op.drop_column("becas_percibidas")
