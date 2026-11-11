"""Registra el vínculo profesional en Personal y las versiones de Memorias."""

from alembic import op
import sqlalchemy as sa

revision = "a9d2f7c4b1e6"
down_revision = "e8c2a4f6b0d1"
branch_labels = None
depends_on = None

TABLES = ("personal", "personal_memoria_version")


def upgrade():
    for table in TABLES:
        with op.batch_alter_table(table) as batch:
            batch.add_column(sa.Column("vinculo_profesional", sa.String(7), nullable=True))
            batch.create_check_constraint(
                f"ck_{table}_vinculo_profesional", "vinculo_profesional IN ('interno', 'externo')"
            )


def downgrade():
    for table in reversed(TABLES):
        with op.batch_alter_table(table) as batch:
            batch.drop_constraint(f"ck_{table}_vinculo_profesional", type_="check")
            batch.drop_column("vinculo_profesional")
