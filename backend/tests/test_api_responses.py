import unittest

from flask import Flask

from modules.shared.controllers.responses import (
    error_response,
    paginated_response,
    success_response,
)
from modules.shared.routes.status import health_bp


class ApiResponsesTestCase(unittest.TestCase):

    def setUp(self):
        self.app = Flask(__name__)

    def test_success_response_usa_contrato_base(self):
        with self.app.app_context():
            response, status_code = success_response({"status": "ok"})

        self.assertEqual(status_code, 200)
        self.assertEqual(
            response.get_json(),
            {
                "data": {"status": "ok"},
                "meta": {},
                "error": None,
            },
        )

    def test_paginated_response_calcula_metadata(self):
        with self.app.app_context():
            response, status_code = paginated_response(
                data=[{"id": 1}],
                page=2,
                per_page=9,
                total=20,
            )

        self.assertEqual(status_code, 200)
        self.assertEqual(response.get_json()["data"], [{"id": 1}])
        self.assertEqual(
            response.get_json()["meta"],
            {
                "page": 2,
                "per_page": 9,
                "total": 20,
                "total_pages": 3,
            },
        )
        self.assertIsNone(response.get_json()["error"])

    def test_error_response_usa_mensaje_seguro_por_codigo(self):
        with self.app.app_context():
            response, status_code = error_response(
                "VALIDATION_ERROR",
                details={"campo": "nombre"},
                status_code=422,
            )

        self.assertEqual(status_code, 422)
        self.assertIsNone(response.get_json()["data"])
        self.assertEqual(response.get_json()["error"]["code"], "VALIDATION_ERROR")
        self.assertEqual(response.get_json()["error"]["details"], {"campo": "nombre"})
        self.assertIn("Verifique los datos", response.get_json()["error"]["message"])

    def test_health_endpoint_usa_contrato_uniforme(self):
        self.app.register_blueprint(health_bp)

        response = self.app.test_client().get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {
                "data": {"status": "ok"},
                "meta": {},
                "error": None,
            },
        )


if __name__ == "__main__":
    unittest.main()
