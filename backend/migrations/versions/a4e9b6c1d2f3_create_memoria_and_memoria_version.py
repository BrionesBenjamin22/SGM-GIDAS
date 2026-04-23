"""create memoria and memoria_version

Revision ID: a4e9b6c1d2f3
Revises: f2a1c9d4b7e3
Create Date: 2026-04-22 21:47:03.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a4e9b6c1d2f3'
down_revision = 'f2a1c9d4b7e3'
branch_labels = None
depends_on = None


estado_memoria_enum = sa.Enum(
    'abierta',
    'en revision',
    'cerrada',
    name='estado_memoria_enum',
    native_enum=False,
    create_constraint=True
)


def upgrade():
    op.create_table(
        'memoria',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('periodo_inicio', sa.String(length=50), nullable=False),
        sa.Column('periodo_fin', sa.String(length=50), nullable=False),
        sa.Column('version_actual_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('activo', sa.Boolean(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('deleted_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['usuario.id']),
        sa.ForeignKeyConstraint(['deleted_by'], ['usuario.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'memoria_version',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('numero_version', sa.Integer(), nullable=False),
        sa.Column('fecha_apertura', sa.DateTime(), nullable=False),
        sa.Column('fecha_cierre', sa.DateTime(), nullable=True),
        sa.Column('estado', estado_memoria_enum, nullable=False),
        sa.Column('memoria_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('activo', sa.Boolean(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('deleted_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['usuario.id']),
        sa.ForeignKeyConstraint(['deleted_by'], ['usuario.id']),
        sa.ForeignKeyConstraint(['memoria_id'], ['memoria.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'memoria_id',
            'numero_version',
            name='uq_memoria_version_numero'
        )
    )

    op.create_foreign_key(
        'fk_memoria_version_actual_id',
        'memoria',
        'memoria_version',
        ['version_actual_id'],
        ['id']
    )


def downgrade():
    op.drop_constraint(
        'fk_memoria_version_actual_id',
        'memoria',
        type_='foreignkey'
    )
    op.drop_table('memoria_version')
    op.drop_table('memoria')
    estado_memoria_enum.drop(op.get_bind(), checkfirst=True)
