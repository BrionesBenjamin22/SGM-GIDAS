"""add es_coordinador to investigadorxproyecto

Revision ID: f2a1c9d4b7e3
Revises: 8c4f9a21b6de
Create Date: 2026-04-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f2a1c9d4b7e3'
down_revision = '8c4f9a21b6de'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'investigadorxproyecto',
        sa.Column(
            'es_coordinador',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('false')
        )
    )
    op.alter_column(
        'investigadorxproyecto',
        'es_coordinador',
        server_default=None
    )


def downgrade():
    op.drop_column('investigadorxproyecto', 'es_coordinador')
