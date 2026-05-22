"""add fecha alta grupo to business entities

Revision ID: c2f7a1d4b8e9
Revises: b1e4c7d9a2f6
Create Date: 2026-04-25 23:55:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "c2f7a1d4b8e9"
down_revision = "b1e4c7d9a2f6"
branch_labels = None
depends_on = None


TABLES = [
    "beca",
    "becario",
    "investigador",
    "personal",
]


def upgrade():
    for table_name in TABLES:
        op.add_column(
            table_name,
            sa.Column("fecha_alta_grupo", sa.Date(), nullable=True)
        )


def downgrade():
    for table_name in reversed(TABLES):
        op.drop_column(table_name, "fecha_alta_grupo")
