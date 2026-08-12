import unittest
from unittest.mock import patch

from flask import Flask

from modules.shared.routes.status import health_bp


class ReadinessTestCase(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config["RATELIMIT_STORAGE_URI"] = "memory://"
        self.app.register_blueprint(health_bp)
        self.client = self.app.test_client()

    def test_liveness_no_consulta_dependencias(self):
        with patch("modules.shared.routes.status.check_database") as database:
            response = self.client.get("/health/live")
        self.assertEqual(response.status_code, 200)
        database.assert_not_called()

    @patch("modules.shared.routes.status.check_redis")
    @patch("modules.shared.routes.status.check_database")
    def test_readiness_responde_ready(self, database, redis):
        response = self.client.get("/health/ready")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["status"], "ready")
        database.assert_called_once()
        redis.assert_called_once()

    @patch("modules.shared.routes.status.check_redis")
    @patch("modules.shared.routes.status.check_database", side_effect=RuntimeError("db secret"))
    def test_readiness_degradado_no_expone_excepcion(self, database, redis):
        response = self.client.get("/health/ready")
        self.assertEqual(response.status_code, 503)
        body = response.get_json()
        self.assertEqual(body["error"]["details"]["dependencies"]["database"], "unavailable")
        self.assertNotIn("db secret", response.get_data(as_text=True))


if __name__ == "__main__":
    unittest.main()
