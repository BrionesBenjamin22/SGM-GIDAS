"""add audit fields to articulo_divulgacion

Revision ID: c7d9e2a4b1f8
Revises: f2a1c9d4b7e3
Create Date: 2026-04-07 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c7d9e2a4b1f8'
down_revision = 'f2a1c9d4b7e3'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'articulo_divulgacion',
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.text('CURRENT_TIMESTAMP')
        )
    )
    op.add_column(
        'articulo_divulgacion',
        sa.Column('deleted_at', sa.DateTime(), nullable=True)
    )
    op.add_column(
        'articulo_divulgacion',
        sa.Column(
            'activo',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('true')
        )
    )
    op.add_column(
        'articulo_divulgacion',
        sa.Column('created_by', sa.Integer(), nullable=True)
    )
    op.add_column(
        'articulo_divulgacion',
        sa.Column('deleted_by', sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        'fk_articulo_divulgacion_created_by_usuario',
        'articulo_divulgacion',
        'usuario',
        ['created_by'],
        ['id']
    )
    op.create_foreign_key(
        'fk_articulo_divulgacion_deleted_by_usuario',
        'articulo_divulgacion',
        'usuario',
        ['deleted_by'],
        ['id']
    )
    op.alter_column('articulo_divulgacion', 'created_at', server_default=None)
    op.alter_column('articulo_divulgacion', 'activo', server_default=None)


def downgrade():
    op.drop_constraint(
        'fk_articulo_divulgacion_deleted_by_usuario',
        'articulo_divulgacion',
        type_='foreignkey'
    )
    op.drop_constraint(
        'fk_articulo_divulgacion_created_by_usuario',
        'articulo_divulgacion',
        type_='foreignkey'
    )
    op.drop_column('articulo_divulgacion', 'deleted_by')
    op.drop_column('articulo_divulgacion', 'created_by')
    op.drop_column('articulo_divulgacion', 'activo')
    op.drop_column('articulo_divulgacion', 'deleted_at')
    op.drop_column('articulo_divulgacion', 'created_at')
