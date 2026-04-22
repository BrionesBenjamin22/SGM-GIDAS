"""add audit fields to planificacion_grupo

Revision ID: 5b0d1e4c2a7f
Revises: 1a35be73671a
Create Date: 2026-03-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5b0d1e4c2a7f'
down_revision = '1a35be73671a'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'planificacion_grupo',
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.text('CURRENT_TIMESTAMP')
        )
    )
    op.add_column(
        'planificacion_grupo',
        sa.Column('deleted_at', sa.DateTime(), nullable=True)
    )
    op.add_column(
        'planificacion_grupo',
        sa.Column(
            'activo',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('true')
        )
    )
    op.add_column(
        'planificacion_grupo',
        sa.Column('created_by', sa.Integer(), nullable=True)
    )
    op.add_column(
        'planificacion_grupo',
        sa.Column('deleted_by', sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        'fk_planificacion_grupo_created_by_usuario',
        'planificacion_grupo',
        'usuario',
        ['created_by'],
        ['id']
    )
    op.create_foreign_key(
        'fk_planificacion_grupo_deleted_by_usuario',
        'planificacion_grupo',
        'usuario',
        ['deleted_by'],
        ['id']
    )
    op.alter_column('planificacion_grupo', 'created_at', server_default=None)
    op.alter_column('planificacion_grupo', 'activo', server_default=None)


def downgrade():
    op.drop_constraint(
        'fk_planificacion_grupo_deleted_by_usuario',
        'planificacion_grupo',
        type_='foreignkey'
    )
    op.drop_constraint(
        'fk_planificacion_grupo_created_by_usuario',
        'planificacion_grupo',
        type_='foreignkey'
    )
    op.drop_column('planificacion_grupo', 'deleted_by')
    op.drop_column('planificacion_grupo', 'created_by')
    op.drop_column('planificacion_grupo', 'activo')
    op.drop_column('planificacion_grupo', 'deleted_at')
    op.drop_column('planificacion_grupo', 'created_at')
