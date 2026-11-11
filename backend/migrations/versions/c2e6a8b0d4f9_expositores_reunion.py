"""Expositores independientes y nombres congelados; sin convertir autorías."""
from alembic import op
import sqlalchemy as sa

revision = "c2e6a8b0d4f9"
down_revision = "a9d2f7c4b1e6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("trabajo_reunion_expositor",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("trabajo_id", sa.Integer(), sa.ForeignKey("trabajo_reunion_cientifica.id", ondelete="CASCADE"), nullable=False),
        sa.Column("investigador_id", sa.Integer(), sa.ForeignKey("investigador.id", ondelete="RESTRICT")),
        sa.Column("becario_id", sa.Integer(), sa.ForeignKey("becario.id", ondelete="RESTRICT")),
        sa.Column("personal_id", sa.Integer(), sa.ForeignKey("personal.id", ondelete="RESTRICT")),
        sa.Column("nombre_externo", sa.String(120)),
        sa.Column("nombre_clave", sa.String(120)),
        sa.CheckConstraint("(CASE WHEN investigador_id IS NULL THEN 0 ELSE 1 END + CASE WHEN becario_id IS NULL THEN 0 ELSE 1 END + CASE WHEN personal_id IS NULL THEN 0 ELSE 1 END + CASE WHEN nombre_externo IS NULL THEN 0 ELSE 1 END) = 1", name="ck_expositor_una_identidad"),
        sa.CheckConstraint("(nombre_externo IS NULL AND nombre_clave IS NULL) OR (nombre_externo IS NOT NULL AND nombre_clave IS NOT NULL AND length(trim(nombre_externo)) > 0 AND length(trim(nombre_clave)) > 0)", name="ck_expositor_nombre_externo"),
        *(sa.UniqueConstraint("trabajo_id", campo, name=f"uq_expositor_{campo}") for campo in ("investigador_id", "becario_id", "personal_id", "nombre_clave")))
    for campo in ("trabajo_id", "investigador_id", "becario_id", "personal_id"):
        op.create_index(f"ix_trabajo_reunion_expositor_{campo}", "trabajo_reunion_expositor", [campo])
    op.add_column("trabajo_reunion_cientifica_memoria_version", sa.Column("expositores", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("trabajo_reunion_cientifica_memoria_version", "expositores")
    op.drop_table("trabajo_reunion_expositor")
