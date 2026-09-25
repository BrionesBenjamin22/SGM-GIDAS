import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class HttpsDeploymentTemplateTestCase(unittest.TestCase):

    def test_proxy_externo_deja_https_preparado_pero_inactivo(self):
        template = (
            REPOSITORY_ROOT / "nginx" / "gidas.external.conf.example"
        ).read_text(encoding="utf-8")

        self.assertIn("#     listen 443 ssl;", template)
        self.assertIn("#     ssl_protocols TLSv1.2 TLSv1.3;", template)
        self.assertIn("#     ssl_certificate ", template)
        self.assertIn("#     ssl_certificate_key ", template)
        self.assertIn("# return 301 https://$host$request_uri;", template)
        self.assertNotIn("\n    listen 443 ssl;", template)
        self.assertNotIn("\n    return 301 https://$host$request_uri;", template)

    def test_proxy_interno_preserva_el_esquema_https_validado(self):
        internal_proxy = (REPOSITORY_ROOT / "nginx" / "default.conf").read_text(
            encoding="utf-8"
        )

        self.assertIn("map $http_x_forwarded_proto $gidas_forwarded_proto", internal_proxy)
        self.assertIn("https https;", internal_proxy)
        self.assertNotIn("proxy_set_header X-Forwarded-Proto $scheme;", internal_proxy)
        self.assertEqual(
            internal_proxy.count(
                "proxy_set_header X-Forwarded-Proto $gidas_forwarded_proto;"
            ),
            7,
        )

    def test_ejemplo_productivo_recomienda_binding_a_loopback(self):
        environment_example = (REPOSITORY_ROOT / ".env.production.example").read_text(
            encoding="utf-8"
        )

        self.assertIn("NGINX_BIND_ADDRESS=127.0.0.1", environment_example)
        self.assertIn("# GIDAS_SERVER_NAME=", environment_example)
        self.assertIn("# GIDAS_TLS_CERTIFICATE_PATH=", environment_example)
        self.assertIn("# GIDAS_TLS_CERTIFICATE_KEY_PATH=", environment_example)


if __name__ == "__main__":
    unittest.main()
