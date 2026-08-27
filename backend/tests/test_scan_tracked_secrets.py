import unittest

from tools.scan_tracked_secrets import findings_for_text


class ScanTrackedSecretsTestCase(unittest.TestCase):

    def test_detecta_asignacion_de_secreto_real(self):
        findings = findings_for_text(
            ".env",
            "JWT_SECRET=valor-real-suficientemente-largo-123456",
        )

        self.assertEqual(len(findings), 1)
        self.assertNotIn("valor-real", findings[0])

    def test_detecta_clave_privada(self):
        private_key_fixture = (
            "-----BEGIN " + "PRIVATE KEY-----\ncontenido\n-----END PRIVATE KEY-----"
        )
        findings = findings_for_text(
            "server.key",
            private_key_fixture,
        )

        self.assertEqual(findings, ["server.key: contiene una clave privada"])

    def test_permite_placeholders_versionables(self):
        text = "\n".join(
            [
                "SECRET_KEY=replace-with-secure-secret",
                "POSTGRES_ADMIN_PASSWORD=<CLAVE_ALEATORIA>",
                "DATABASE_URL=postgresql://gidas_app:${POSTGRES_APP_PASSWORD}@db/gidas",
            ]
        )

        self.assertEqual(findings_for_text(".env.production.example", text), [])

    def test_no_expone_valor_en_descripcion_del_hallazgo(self):
        secret = "super-secreto-que-no-debe-imprimirse-123456"

        findings = findings_for_text("config.env", f"SECRET_KEY={secret}")

        self.assertNotIn(secret, " ".join(findings))


if __name__ == "__main__":
    unittest.main()
