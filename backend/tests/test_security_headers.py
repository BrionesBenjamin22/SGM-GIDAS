import unittest

from app import create_app


class SecurityHeadersTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config.update(
            TESTING=True,
            HSTS_ENABLED=False,
            HSTS_MAX_AGE=31536000,
        )

        @self.app.get("/_test/unexpected-security-header-error")
        def unexpected_error():
            raise RuntimeError("detalle interno")

        self.client = self.app.test_client()

    def _assert_defensive_headers(self, response):
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(response.headers["X-Frame-Options"], "SAMEORIGIN")
        self.assertEqual(
            response.headers["Referrer-Policy"],
            "strict-origin-when-cross-origin",
        )
        self.assertIn("geolocation=()", response.headers["Permissions-Policy"])
        csp = response.headers["Content-Security-Policy"]
        self.assertIn("default-src 'none'", csp)
        self.assertNotIn("unsafe-eval", csp)
        self.assertEqual(response.headers["Cache-Control"], "private, no-store")

    def test_api_exitosa_incluye_headers_defensivos(self):
        response = self.client.get("/api/v1/health")

        self.assertEqual(response.status_code, 200)
        self._assert_defensive_headers(response)

    def test_error_404_incluye_headers_defensivos(self):
        response = self.client.get("/api/v1/no-existe")

        self.assertEqual(response.status_code, 404)
        self._assert_defensive_headers(response)

    def test_error_500_incluye_headers_defensivos(self):
        response = self.client.get("/_test/unexpected-security-header-error")

        self.assertEqual(response.status_code, 500)
        self._assert_defensive_headers(response)

    def test_hsts_no_aparece_por_http_aunque_este_habilitado(self):
        self.app.config["HSTS_ENABLED"] = True

        response = self.client.get("/api/v1/health")

        self.assertIsNone(response.headers.get("Strict-Transport-Security"))

    def test_hsts_aparece_por_https_solo_cuando_esta_habilitado(self):
        self.app.config["HSTS_ENABLED"] = True

        response = self.client.get(
            "/api/v1/health",
            headers={"X-Forwarded-Proto": "https"},
        )

        self.assertEqual(
            response.headers["Strict-Transport-Security"],
            "max-age=31536000; includeSubDomains",
        )


if __name__ == "__main__":
    unittest.main()
