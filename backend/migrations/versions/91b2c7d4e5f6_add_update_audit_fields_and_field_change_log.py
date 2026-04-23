"""add update audit fields and field change log

Revision ID: 91b2c7d4e5f6
Revises: e13c4b7d9a21
Create Date: 2026-04-23 00:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '91b2c7d4e5f6'
down_revision = 'e13c4b7d9a21'
branch_labels = None
depends_on = None


AUDIT_TABLES = [
    'actividad_y_catedra_posgrado',
    'investigador_actividad_grado',
    'articulo_divulgacion',
    'beca',
    'beca_becario',
    'directivo_grupo',
    'directivo',
    'distincion_recibida',
    'documentacion_bibliografica',
    'equipamiento_grupo',
    'erogacion',
    'grupo_utn',
    'memoria',
    'memoria_version',
    'participacion_relevante',
    'persona',
    'personal',
    'becario',
    'investigador',
    'becario_historial_horas',
    'investigador_historial_horas',
    'personal_historial_horas',
    'planificacion_grupo',
    'investigadorxproyecto',
    'becarioxproyecto',
    'proyecto_investigacion',
    'registros_patente_grupo',
    'trabajo_reunion_cientifica',
    'trabajos_revista',
    'adoptante_x_transferencia',
    'adoptante',
    'transferencia_socio_productiva',
    'usuario',
    'visita_grupo',
]


def upgrade():
    for table_name in AUDIT_TABLES:
        op.add_column(
            table_name,
            sa.Column('updated_at', sa.DateTime(), nullable=True)
        )
        op.add_column(
            table_name,
            sa.Column('updated_by', sa.Integer(), nullable=True)
        )
        op.create_foreign_key(
            f'fk_{table_name}_updated_by_usuario',
            table_name,
            'usuario',
            ['updated_by'],
            ['id']
        )

    op.create_table(
        'auditoria_campo',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entidad', sa.String(length=100), nullable=False),
        sa.Column('registro_id', sa.Integer(), nullable=False),
        sa.Column('campo', sa.String(length=100), nullable=False),
        sa.Column('valor_anterior', sa.JSON(), nullable=True),
        sa.Column('valor_nuevo', sa.JSON(), nullable=True),
        sa.Column('fecha_cambio', sa.DateTime(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=True),
        sa.Column('memoria_id', sa.Integer(), nullable=True),
        sa.Column('memoria_version_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id']),
        sa.ForeignKeyConstraint(['memoria_id'], ['memoria.id']),
        sa.ForeignKeyConstraint(['memoria_version_id'], ['memoria_version.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        'ix_auditoria_campo_entidad_registro',
        'auditoria_campo',
        ['entidad', 'registro_id'],
        unique=False
    )
    op.create_index(
        'ix_auditoria_campo_memoria_version_id',
        'auditoria_campo',
        ['memoria_version_id'],
        unique=False
    )


def downgrade():
    op.drop_index('ix_auditoria_campo_memoria_version_id', table_name='auditoria_campo')
    op.drop_index('ix_auditoria_campo_entidad_registro', table_name='auditoria_campo')
    op.drop_table('auditoria_campo')

    for table_name in reversed(AUDIT_TABLES):
        op.drop_constraint(
            f'fk_{table_name}_updated_by_usuario',
            table_name,
            type_='foreignkey'
        )
        op.drop_column(table_name, 'updated_by')
        op.drop_column(table_name, 'updated_at')
