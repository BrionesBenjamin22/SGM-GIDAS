"""merge refresh token and catalog audit heads

Revision ID: 9823db81d6d2
Revises: ab3c9d2e7f10, b6a4d8f2c9e1
Create Date: 2026-06-13 19:02:45.709206

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9823db81d6d2'
down_revision = ('ab3c9d2e7f10', 'b6a4d8f2c9e1')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
