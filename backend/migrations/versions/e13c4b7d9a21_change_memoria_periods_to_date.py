"""change memoria periods to date

Revision ID: e13c4b7d9a21
Revises: bd6579acf42a
Create Date: 2026-04-22 22:18:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e13c4b7d9a21'
down_revision = 'bd6579acf42a'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('memoria') as batch_op:
        batch_op.alter_column(
            'periodo_inicio',
            existing_type=sa.String(length=50),
            type_=sa.Date(),
            existing_nullable=False,
            postgresql_using='periodo_inicio::date'
        )
        batch_op.alter_column(
            'periodo_fin',
            existing_type=sa.String(length=50),
            type_=sa.Date(),
            existing_nullable=False,
            postgresql_using='periodo_fin::date'
        )


def downgrade():
    with op.batch_alter_table('memoria') as batch_op:
        batch_op.alter_column(
            'periodo_fin',
            existing_type=sa.Date(),
            type_=sa.String(length=50),
            existing_nullable=False,
            postgresql_using='periodo_fin::text'
        )
        batch_op.alter_column(
            'periodo_inicio',
            existing_type=sa.Date(),
            type_=sa.String(length=50),
            existing_nullable=False,
            postgresql_using='periodo_inicio::text'
        )
