import unittest

from flask import request

from app import create_app


class RequestLimitsTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config.update(TESTING=True, MAX_CONTENT_LENGTH=16)

        @self.app.post("/_test/request-size")
        def consume_request_body():
            request.get_data()
            return "", 204

        self.client = self.app.test_client()

    def test_acepta_cuerpo_debajo_del_limite(self):
        response = self.client.post(
            "/_test/request-size",
            data=b"a" * 15,
            content_type="application/octet-stream",
        )

        self.assertEqual(response.status_code, 204)

    def test_acepta_cuerpo_en_el_limite(self):
        response = self.client.post(
            "/_test/request-size",
            data=b"a" * 16,
            content_type="application/octet-stream",
        )

        self.assertEqual(response.status_code, 204)

    def test_rechaza_cuerpo_sobre_el_limite_con_error_seguro(self):
        response = self.client.post(
            "/_test/request-size",
            data=b"a" * 17,
            content_type="application/octet-stream",
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


if __name__ == "__main__":
    unittest.main()
