import unittest

from flask import request

from app import create_app


class RequestLimitsTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config.update(
            TESTING=True,
            MAX_CONTENT_LENGTH=16,
            MAX_JSON_CONTENT_LENGTH=8,
        )

        @self.app.post("/api/_test/request-size")
        def consume_request_body():
            request.get_data()
            return "", 204

        self.client = self.app.test_client()

    def test_acepta_cuerpo_debajo_del_limite(self):
        response = self.client.post(
            "/api/_test/request-size",
            data=b'{"a":1}',
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)

    def test_acepta_cuerpo_en_el_limite(self):
        response = self.client.post(
            "/api/_test/request-size",
            data=b'{"a":12}',
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)

    def test_rechaza_cuerpo_sobre_el_limite_con_error_seguro(self):
        response = self.client.post(
            "/api/_test/request-size",
            data=b'{"a":123}',
            content_type="application/json",
            headers={"X-Request-ID": "request-limit-test"},
        )

        payload = response.get_json()
        self.assertEqual(response.status_code, 413)
        self.assertEqual(payload["data"], None)
        self.assertEqual(payload["error"]["code"], "REQUEST_TOO_LARGE")
        self.assertEqual(
            payload["error"]["details"]["request_id"],
            "request-limit-test",
        )
        self.assertNotIn("traceback", response.get_data(as_text=True).lower())
        self.assertEqual(response.headers["X-Request-ID"], "request-limit-test")

    def test_rechaza_cuerpo_no_json_en_mutacion_api(self):
        response = self.client.post(
            "/api/_test/request-size",
            data="a=1",
            content_type="application/x-www-form-urlencoded",
            headers={"X-Request-ID": "content-type-test"},
        )

        payload = response.get_json()
        self.assertEqual(response.status_code, 415)
        self.assertEqual(payload["error"]["code"], "UNSUPPORTED_MEDIA_TYPE")
        self.assertNotIn("a=1", response.get_data(as_text=True))
        self.assertEqual(response.headers["X-Request-ID"], "content-type-test")

    def test_permite_mutacion_sin_cuerpo(self):
        response = self.client.post("/api/_test/request-size")

        self.assertEqual(response.status_code, 204)

    def test_ruta_inexistente_con_cuerpo_conserva_404(self):
        response = self.client.post(
            "/api/_test/no-existe",
            data="a=1",
            content_type="application/x-www-form-urlencoded",
        )

        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
