import unittest

from flask import Flask

from extension import db
from modules.auth.models.persona import Persona  # noqa: F401
from modules.auth.models.refresh_token_session import RefreshTokenSession
from modules.auth.models.usuario import RolUsuario, Usuario
from modules.auth.services.auth_service import AuthService


class AuthRefreshTokenTestCase(unittest.TestCase):

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
            rol = RolUsuario(nombre="GESTOR")
            db.session.add(rol)
            db.session.flush()

            self.user = Usuario(
                nombre_usuario="usuario.refresh",
                mail="refresh@example.com",
                id_rol=rol.id,
                primer_login=False,
            )
            self.user.set_password("password123")
            db.session.add(self.user)
            db.session.commit()
            self.user_id = self.user.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self):
        return AuthService.login(
            "usuario.refresh",
            "password123",
            metadata={
                "user_agent": "pytest-agent",
                "ip_address": "127.0.0.1",
            },
        )

    def test_login_persiste_hash_y_metadata_de_refresh_token(self):
        with self.app.app_context():
            tokens = self._login()
            session = RefreshTokenSession.query.one()

            self.assertEqual(session.user_id, self.user_id)
            self.assertNotEqual(session.token_hash, tokens["refresh_token"])
            self.assertEqual(len(session.token_hash), 64)
            self.assertEqual(session.user_agent, "pytest-agent")
            self.assertEqual(session.ip_address, "127.0.0.1")
            self.assertIsNone(session.revoked_at)

    def test_refresh_rota_token_y_revoca_el_anterior(self):
        with self.app.app_context():
            tokens = self._login()
            rotated = AuthService.refresh_tokens(tokens["refresh_token"])

            self.assertIn("access_token", rotated)
            self.assertIn("refresh_token", rotated)
            self.assertNotEqual(tokens["refresh_token"], rotated["refresh_token"])

            sessions = RefreshTokenSession.query.order_by(RefreshTokenSession.id).all()
            self.assertEqual(len(sessions), 2)
            self.assertEqual(sessions[0].revoked_reason, "rotated")
            self.assertEqual(sessions[0].replaced_by_id, sessions[1].id)
            self.assertIsNone(sessions[1].revoked_at)

            with self.assertRaisesRegex(Exception, "revocado"):
                AuthService.refresh_tokens(tokens["refresh_token"])

    def test_refresh_rechaza_usuario_inactivo(self):
        with self.app.app_context():
            tokens = self._login()
            user = db.session.get(Usuario, self.user_id)
            user.activo = False
            db.session.commit()

            with self.assertRaisesRegex(Exception, "Usuario no encontrado"):
                AuthService.refresh_tokens(tokens["refresh_token"])

    def test_cambio_password_revoca_sesiones_activas(self):
        with self.app.app_context():
            tokens = self._login()

            AuthService.change_password(
                self.user_id,
                "password123",
                "password456",
            )

            session = RefreshTokenSession.query.one()
            self.assertEqual(session.revoked_reason, "password_changed")

            with self.assertRaisesRegex(Exception, "revocado"):
                AuthService.refresh_tokens(tokens["refresh_token"])

    def test_logout_revoca_refresh_token_actual(self):
        with self.app.app_context():
            tokens = self._login()

            AuthService.revoke_refresh_token(tokens["refresh_token"])

            session = RefreshTokenSession.query.one()
            self.assertEqual(session.revoked_reason, "logout")

            with self.assertRaisesRegex(Exception, "revocado"):
                AuthService.refresh_tokens(tokens["refresh_token"])


if __name__ == "__main__":
    unittest.main()
