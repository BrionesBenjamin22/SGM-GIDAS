"""add audit fields to participacion_relevante visita_grupo distincion_recibida

Revision ID: 8c4f9a21b6de
Revises: 5b0d1e4c2a7f
Create Date: 2026-03-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8c4f9a21b6de'
down_revision = '5b0d1e4c2a7f'
branch_labels = None
depends_on = None


def _add_audit_columns(table_name: str):
    op.add_column(
        table_name,
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.text('CURRENT_TIMESTAMP')
        )
    )
    op.add_column(
        table_name,
        sa.Column('deleted_at', sa.DateTime(), nullable=True)
    )
    op.add_column(
        table_name,
        sa.Column(
            'activo',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('true')
        )
    )
    op.add_column(
        table_name,
        sa.Column('created_by', sa.Integer(), nullable=True)
    )
    op.add_column(
        table_name,
        sa.Column('deleted_by', sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        f'fk_{table_name}_created_by_usuario',
        table_name,
        'usuario',
        ['created_by'],
        ['id']
    )
    op.create_foreign_key(
        f'fk_{table_name}_deleted_by_usuario',
        table_name,
        'usuario',
        ['deleted_by'],
        ['id']
    )
    op.alter_column(table_name, 'created_at', server_default=None)
    op.alter_column(table_name, 'activo', server_default=None)


def _drop_audit_columns(table_name: str):
    op.drop_constraint(
        f'fk_{table_name}_deleted_by_usuario',
        table_name,
        type_='foreignkey'
    )
    op.drop_constraint(
        f'fk_{table_name}_created_by_usuario',
        table_name,
        type_='foreignkey'
    )
    op.drop_column(table_name, 'deleted_by')
    op.drop_column(table_name, 'created_by')
    op.drop_column(table_name, 'activo')
    op.drop_column(table_name, 'deleted_at')
    op.drop_column(table_name, 'created_at')


def upgrade():
    _add_audit_columns('participacion_relevante')
    _add_audit_columns('visita_grupo')
    _add_audit_columns('distincion_recibida')


def downgrade():
    _drop_audit_columns('distincion_recibida')
    _drop_audit_columns('visita_grupo')
    _drop_audit_columns('participacion_relevante')
