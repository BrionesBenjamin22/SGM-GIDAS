import datetime
import unittest

from flask import Flask

from extension import db
from modules.auth.models.persona import Persona  # noqa: F401
from modules.auth.models.refresh_token_session import RefreshTokenSession
from modules.auth.models.usuario import RolUsuario, Usuario
from modules.auth.services.refresh_session_cleanup_service import RefreshSessionCleanupService


class AuthRefreshSessionCleanupTestCase(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(
            TESTING=True,
            SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
        )
        db.init_app(self.app)
        with self.app.app_context():
            db.create_all()
            role = RolUsuario(nombre="GESTOR")
            db.session.add(role)
            db.session.flush()
            user = Usuario(
                nombre_usuario="cleanup.user",
                mail="cleanup@example.com",
                id_rol=role.id,
                primer_login=False,
            )
            user.set_password("password123")
            db.session.add(user)
            db.session.commit()
            self.user_id = user.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _session(self, suffix: str, expires_at: datetime.datetime, revoked_at=None):
        session = RefreshTokenSession(
            user_id=self.user_id,
            token_hash=suffix * 64,
            jti=f"00000000-0000-0000-0000-{suffix * 12}",
            expires_at=expires_at,
            revoked_at=revoked_at,
        )
        db.session.add(session)
        return session

    def test_purge_elimina_solo_sesiones_fuera_de_retencion(self):
        now = datetime.datetime(2026, 8, 24, 12, 0, 0)
        with self.app.app_context():
            old_expired = self._session("a", now - datetime.timedelta(days=31))
            old_revoked = self._session(
                "b",
                now + datetime.timedelta(days=1),
                revoked_at=now - datetime.timedelta(days=31),
            )
            recent_expired = self._session("c", now - datetime.timedelta(days=2))
            active = self._session("d", now + datetime.timedelta(days=2))
            db.session.commit()
            ids = {
                "old_expired": old_expired.id,
                "old_revoked": old_revoked.id,
                "recent_expired": recent_expired.id,
                "active": active.id,
            }

            deleted = RefreshSessionCleanupService.purge(30, now=now)

            self.assertEqual(deleted, 2)
            remaining_ids = {row.id for row in RefreshTokenSession.query.all()}
            self.assertNotIn(ids["old_expired"], remaining_ids)
            self.assertNotIn(ids["old_revoked"], remaining_ids)
            self.assertIn(ids["recent_expired"], remaining_ids)
            self.assertIn(ids["active"], remaining_ids)

    def test_dry_run_no_elimina_sesiones(self):
        now = datetime.datetime(2026, 8, 24, 12, 0, 0)
        with self.app.app_context():
            self._session("e", now - datetime.timedelta(days=31))
            db.session.commit()

            count = RefreshSessionCleanupService.purge(30, dry_run=True, now=now)

            self.assertEqual(count, 1)
            self.assertEqual(RefreshTokenSession.query.count(), 1)

    def test_rechaza_retencion_invalida(self):
        with self.app.app_context():
            with self.assertRaisesRegex(ValueError, "mayor o igual a 1"):
                RefreshSessionCleanupService.purge(0)


if __name__ == "__main__":
    unittest.main()
