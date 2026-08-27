from datetime import datetime, timedelta

from sqlalchemy import or_

from extension import db
from modules.auth.models.refresh_token_session import RefreshTokenSession


class RefreshSessionCleanupService:
    """Purga sesiones antiguas sin reducir la ventana de trazabilidad aprobada."""

    @staticmethod
    def _eligible_query(retention_days: int, now: datetime):
        if retention_days < 1:
            raise ValueError("retention_days debe ser mayor o igual a 1")

        cutoff = now - timedelta(days=retention_days)
        return RefreshTokenSession.query.filter(
            or_(
                RefreshTokenSession.expires_at < cutoff,
                RefreshTokenSession.revoked_at < cutoff,
            )
        )

    @classmethod
    def purge(
        cls,
        retention_days: int,
        dry_run: bool = False,
        now: datetime | None = None,
    ) -> int:
        query = cls._eligible_query(retention_days, now or datetime.utcnow())
        count = query.count()
        if dry_run or count == 0:
            return count

        try:
            query.delete(synchronize_session=False)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return count
