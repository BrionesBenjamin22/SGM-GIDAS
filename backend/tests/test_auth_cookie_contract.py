import unittest
from unittest.mock import patch

from flask import Flask

from modules.auth.controllers.auth_controller import AuthController


class AuthCookieContractTestCase(unittest.TestCase):

    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(
            TESTING=True,
            FRONTEND_URLS=["https://gidas.example.com"],
            REFRESH_COOKIE_NAME="gidas_refresh",
            REFRESH_COOKIE_PATH="/api/v1/auth",
            REFRESH_COOKIE_HTTPONLY=True,
            REFRESH_COOKIE_SECURE=True,
            REFRESH_COOKIE_SAMESITE="Lax",
            REFRESH_TOKEN_EXPIRATION_MINUTES=10080,
        )
        self.app.add_url_rule("/api/v1/auth/login", view_func=AuthController.login, methods=["POST"])
        self.app.add_url_rule("/api/v1/auth/refresh", view_func=AuthController.refresh, methods=["POST"])
        self.app.add_url_rule("/api/v1/auth/logout", view_func=AuthController.logout, methods=["POST"])
        self.client = self.app.test_client()

    @patch("modules.auth.controllers.auth_controller.AuthService.login")
    def test_login_emite_cookie_segura_y_no_expone_refresh_en_json(self, login):
        login.return_value = {
            "access_token": "access-value",
            "refresh_token": "refresh-value",
            "user": {"id": 1},
        }

        response = self.client.post(
            "/api/v1/auth/login",
            json={"nombre_usuario": "user", "password": "secret"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("refresh_token", response.get_json())
        cookie = response.headers["Set-Cookie"]
        self.assertIn("gidas_refresh=", cookie)
        self.assertIn("HttpOnly", cookie)
        self.assertIn("Secure", cookie)
        self.assertIn("SameSite=Lax", cookie)
        self.assertIn("Path=/api/v1/auth", cookie)
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    @patch("modules.auth.controllers.auth_controller.AuthService.refresh_tokens")
    def test_refresh_solo_acepta_cookie_y_origen_permitido(self, refresh):
        refresh.return_value = {
            "access_token": "new-access",
            "refresh_token": "new-refresh",
            "user": {"id": 1, "nombre_usuario": "user"},
        }
        self.client.set_cookie("gidas_refresh", "old-refresh", path="/api/v1/auth")

        response = self.client.post(
            "/api/v1/auth/refresh",
            headers={"Origin": "https://gidas.example.com"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {
            "access_token": "new-access",
            "user": {"id": 1, "nombre_usuario": "user"},
        })
        refresh.assert_called_once_with("old-refresh", metadata=unittest.mock.ANY)
        self.assertIn("gidas_refresh=new-refresh", response.headers["Set-Cookie"])

    @patch("modules.auth.controllers.auth_controller.AuthService.refresh_tokens")
    def test_refresh_rechaza_json_y_origen_ausente_antes_del_service(self, refresh):
        response = self.client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "json-token"},
        )

        self.assertEqual(response.status_code, 403)
        refresh.assert_not_called()
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    @patch("modules.auth.controllers.auth_controller.AuthService.refresh_tokens")
    def test_refresh_acepta_referer_permitido_si_origin_no_esta(self, refresh):
        refresh.return_value = {
            "access_token": "a",
            "refresh_token": "r2",
            "user": {"id": 1},
        }
        self.client.set_cookie("gidas_refresh", "r1", path="/api/v1/auth")

        response = self.client.post(
            "/api/v1/auth/refresh",
            headers={"Referer": "https://gidas.example.com/app/page"},
        )

        self.assertEqual(response.status_code, 200)
        refresh.assert_called_once()

    @patch("modules.auth.controllers.auth_controller.AuthService.refresh_tokens")
    def test_refresh_rechaza_origin_null_aunque_referer_sea_permitido(self, refresh):
        self.client.set_cookie("gidas_refresh", "r1", path="/api/v1/auth")

        response = self.client.post(
            "/api/v1/auth/refresh",
            headers={
                "Origin": "null",
                "Referer": "https://gidas.example.com/app/page",
            },
        )

        self.assertEqual(response.status_code, 403)
        refresh.assert_not_called()

    @patch("modules.auth.controllers.auth_controller.AuthService.refresh_tokens")
    def test_refresh_rechaza_origin_con_sintaxis_no_valida(self, refresh):
        self.client.set_cookie("gidas_refresh", "r1", path="/api/v1/auth")

        invalid_origins = (
            "https://gidas.example.com/app",
            "https://gidas.example.com?next=/app",
            "https://user@gidas.example.com",
            "https://gidas.example.com#fragment",
        )
        for origin in invalid_origins:
            with self.subTest(origin=origin):
                response = self.client.post(
                    "/api/v1/auth/refresh",
                    headers={"Origin": origin},
                )
                self.assertEqual(response.status_code, 403)

        refresh.assert_not_called()

    @patch("modules.auth.controllers.auth_controller.AuthService.revoke_refresh_token")
    def test_logout_es_idempotente_y_siempre_borra_cookie(self, revoke):
        revoke.side_effect = Exception("invalid")
        self.client.set_cookie("gidas_refresh", "invalid", path="/api/v1/auth")

        response = self.client.post(
            "/api/v1/auth/logout",
            headers={"Origin": "https://gidas.example.com"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("gidas_refresh=;", response.headers["Set-Cookie"])
        self.assertIn("Expires=Thu, 01 Jan 1970", response.headers["Set-Cookie"])
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    @patch("modules.auth.controllers.auth_controller.AuthService.revoke_refresh_token")
    def test_logout_rechaza_origen_no_permitido_sin_revocar_ni_borrar_cookie(self, revoke):
        self.client.set_cookie("gidas_refresh", "token", path="/api/v1/auth")

        response = self.client.post(
            "/api/v1/auth/logout",
            headers={"Origin": "https://evil.example"},
        )

        self.assertEqual(response.status_code, 403)
        revoke.assert_not_called()
        self.assertNotIn("Set-Cookie", response.headers)


if __name__ == "__main__":
    unittest.main()
