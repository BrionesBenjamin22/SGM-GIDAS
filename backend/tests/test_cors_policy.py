import unittest
from unittest.mock import patch

from config import TestingConfig


class CorsPolicyTestCase(unittest.TestCase):

    def setUp(self):
        with patch.dict("os.environ", {"APP_ENV": "testing"}):
            with patch.object(
                TestingConfig,
                "CORS_ORIGINS",
                ["https://gidas.example.com"],
            ):
                from app import create_app

                self.app = create_app()
        self.client = self.app.test_client()

    def test_origen_permitido_recibe_cors_con_credenciales(self):
        response = self.client.get(
            "/api/v1/health",
            headers={"Origin": "https://gidas.example.com"},
        )

        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "https://gidas.example.com",
        )
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Credentials"),
            "true",
        )

    def test_origen_no_permitido_no_recibe_headers_cors(self):
        response = self.client.get(
            "/api/v1/health",
            headers={"Origin": "https://malicioso.example.com"},
        )

        self.assertIsNone(response.headers.get("Access-Control-Allow-Origin"))
        self.assertIsNone(response.headers.get("Access-Control-Allow-Credentials"))

    def test_solicitud_sin_origin_no_recibe_autorizacion_cors(self):
        response = self.client.get("/api/v1/health")

        self.assertIsNone(response.headers.get("Access-Control-Allow-Origin"))

    def test_preflight_permitido_limita_metodo_y_headers(self):
        response = self.client.options(
            "/api/v1/auth/login",
            headers={
                "Origin": "https://gidas.example.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type, Authorization",
            },
        )

        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "https://gidas.example.com",
        )
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Credentials"),
            "true",
        )
        allowed_methods = response.headers.get("Access-Control-Allow-Methods", "")
        self.assertIn("POST", allowed_methods)
        allowed_headers = response.headers.get("Access-Control-Allow-Headers", "")
        self.assertIn("Authorization", allowed_headers)
        self.assertIn("Content-Type", allowed_headers)


if __name__ == "__main__":
    unittest.main()
