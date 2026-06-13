from datetime import datetime

from extension import db


class RefreshTokenSession(db.Model):
    __tablename__ = "refresh_token_session"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("usuario.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash = db.Column(db.String(64), unique=True, nullable=False)
    jti = db.Column(db.String(36), unique=True, nullable=False)
    issued_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    revoked_at = db.Column(db.DateTime, nullable=True, index=True)
    revoked_reason = db.Column(db.String(120), nullable=True)
    replaced_by_id = db.Column(
        db.Integer,
        db.ForeignKey("refresh_token_session.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_agent = db.Column(db.String(255), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)

    user = db.relationship(
        "Usuario",
        back_populates="refresh_sessions",
        foreign_keys=[user_id],
    )
    replaced_by = db.relationship(
        "RefreshTokenSession",
        remote_side=[id],
        foreign_keys=[replaced_by_id],
    )

    @property
    def is_revoked(self) -> bool:
        return self.revoked_at is not None

    @property
    def is_expired(self) -> bool:
        return self.expires_at <= datetime.utcnow()

    def revoke(self, reason: str, replaced_by_id: int | None = None):
        self.revoked_at = datetime.utcnow()
        self.revoked_reason = reason
        if replaced_by_id is not None:
            self.replaced_by_id = replaced_by_id
