"""Jornadas civiles de reuniones y fechas congeladas de sus versiones."""
from alembic import op
import sqlalchemy as sa

revision = "c7a9e1f3b5d8"
down_revision = "c2e6a8b0d4f9"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "trabajo_reunion_jornada",
        sa.Column("trabajo_reunion_id", sa.Integer(), sa.ForeignKey("trabajo_reunion_cientifica.id"), primary_key=True),
        sa.Column("fecha", sa.Date(), primary_key=True),
        sa.CheckConstraint("fecha >= '2010-01-01'", name="ck_reunion_jornada_min_fecha"),
    )
    op.create_index("ix_trabajo_reunion_jornada_fecha", "trabajo_reunion_jornada", ["fecha"])
    op.execute("INSERT INTO trabajo_reunion_jornada (trabajo_reunion_id, fecha) SELECT id, fecha_presentacion FROM trabajo_reunion_cientifica")
    with op.batch_alter_table("trabajo_reunion_cientifica_memoria_version") as batch:
        batch.add_column(sa.Column("fechas_presentacion", sa.JSON(), nullable=True))
    snapshots = sa.table("trabajo_reunion_cientifica_memoria_version", sa.column("id", sa.Integer()),
                         sa.column("fecha_presentacion", sa.Date()), sa.column("fechas_presentacion", sa.JSON()))
    connection = op.get_bind()
    for row in connection.execute(sa.select(snapshots.c.id, snapshots.c.fecha_presentacion)).mappings():
        connection.execute(snapshots.update().where(snapshots.c.id == row["id"]).values(
            fechas_presentacion=[row["fecha_presentacion"].isoformat()]))
    with op.batch_alter_table("trabajo_reunion_cientifica_memoria_version") as batch:
        batch.alter_column("fechas_presentacion", existing_type=sa.JSON(), nullable=False)


def downgrade():
    # Las primeras jornadas siguen en la columna de compatibilidad.
    with op.batch_alter_table("trabajo_reunion_cientifica_memoria_version") as batch:
        batch.drop_column("fechas_presentacion")
    op.drop_index("ix_trabajo_reunion_jornada_fecha", table_name="trabajo_reunion_jornada")
    op.drop_table("trabajo_reunion_jornada")
