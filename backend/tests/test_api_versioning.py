import unittest

from flask import Blueprint, Flask

from app import create_app

from modules.shared.routes.status import health_bp
from modules.shared.routes.versioning import (
    API_VERSION,
    API_VERSION_HEADER,
    API_V1_PREFIX,
    register_api_version_header,
    register_blueprints,
)


class ApiVersioningTestCase(unittest.TestCase):

    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(TESTING=True)
        register_blueprints(self.app, [health_bp])
        register_api_version_header(self.app)
        self.client = self.app.test_client()

    def test_registra_ruta_legacy_y_versionada(self):
        rules = {rule.rule for rule in self.app.url_map.iter_rules()}

        self.assertIn("/health", rules)
        self.assertIn(f"{API_V1_PREFIX}/health", rules)

    def test_endpoint_versionado_responde_con_header_api_version(self):
        response = self.client.get(f"{API_V1_PREFIX}/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers[API_VERSION_HEADER], API_VERSION)
        self.assertEqual(response.get_json()["data"], {"status": "ok"})

    def test_endpoint_legacy_no_agrega_header_api_version(self):
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertNotIn(API_VERSION_HEADER, response.headers)

    def test_nombre_endpoint_versionado_no_colisiona_con_legacy(self):
        endpoints = {rule.endpoint for rule in self.app.url_map.iter_rules()}

        self.assertIn("health.health", endpoints)
        self.assertIn("v1_health.health", endpoints)

    def test_preserva_prefijo_original_del_blueprint(self):
        app = Flask(__name__)
        items_bp = Blueprint("items", __name__, url_prefix="/items")

        @items_bp.get("/")
        def listar_items():
            return []

        register_blueprints(app, [items_bp])

        rules = {rule.rule for rule in app.url_map.iter_rules()}
        self.assertIn("/items/", rules)
        self.assertIn(f"{API_V1_PREFIX}/items/", rules)

    def test_app_expone_login_y_endpoint_protegido_en_v1(self):
        app = create_app()
        rules = {rule.rule for rule in app.url_map.iter_rules()}

        self.assertIn(f"{API_V1_PREFIX}/auth/login", rules)
        self.assertIn(f"{API_V1_PREFIX}/auth/perfil", rules)


if __name__ == "__main__":
    unittest.main()
