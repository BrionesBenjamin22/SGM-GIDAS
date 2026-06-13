"""add refresh token session

Revision ID: b6a4d8f2c9e1
Revises: 91b2c7d4e5f6
Create Date: 2026-06-13
"""

from alembic import op
import sqlalchemy as sa


revision = "b6a4d8f2c9e1"
down_revision = "91b2c7d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "refresh_token_session",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("jti", sa.String(length=36), nullable=False),
        sa.Column("issued_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column("revoked_reason", sa.String(length=120), nullable=True),
        sa.Column("replaced_by_id", sa.Integer(), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.ForeignKeyConstraint(["replaced_by_id"], ["refresh_token_session.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["usuario.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("jti"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index(
        "ix_refresh_token_session_expires_at",
        "refresh_token_session",
        ["expires_at"],
        unique=False,
    )
    op.create_index(
        "ix_refresh_token_session_revoked_at",
        "refresh_token_session",
        ["revoked_at"],
        unique=False,
    )
    op.create_index(
        "ix_refresh_token_session_user_id",
        "refresh_token_session",
        ["user_id"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_refresh_token_session_user_id", table_name="refresh_token_session")
    op.drop_index("ix_refresh_token_session_revoked_at", table_name="refresh_token_session")
    op.drop_index("ix_refresh_token_session_expires_at", table_name="refresh_token_session")
    op.drop_table("refresh_token_session")
