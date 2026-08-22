import re
import unittest
from unittest.mock import patch

from app import create_app


class IdorBolaPersonalGrupoTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config.update(TESTING=True)
        self.client = self.app.test_client()

    @staticmethod
    def _materialize_path(rule: str) -> str:
        path = re.sub(r"<int:[^>]+>", "1", rule)
        return re.sub(r"<string:rol>", "investigador", path)

    def _mutation_rules(self):
        prefixes = ("/api/v1/personal", "/api/v1/grupo")
        mutation_methods = {"POST", "PUT", "PATCH", "DELETE"}
        rules = []
        for rule in self.app.url_map.iter_rules():
            if not rule.rule.startswith(prefixes):
                continue
            for method in sorted(rule.methods & mutation_methods):
                rules.append((method, self._materialize_path(rule.rule)))
        return sorted(rules)

    def test_lectura_no_puede_ejecutar_ninguna_mutacion(self):
        rules = self._mutation_rules()
        self.assertGreater(len(rules), 0)

        with patch(
            "modules.shared.services.middleware.AuthService.verify_token",
            return_value={"sub": "91", "rol": "LECTURA"},
        ):
            for method, path in rules:
                with self.subTest(method=method, path=path):
                    response = self.client.open(
                        path,
                        method=method,
                        json={},
                        headers={"Authorization": "Bearer fake-token"},
                    )
                    self.assertEqual(response.status_code, 403)
                    self.assertEqual(
                        response.get_json()["error"]["code"],
                        "FORBIDDEN",
                    )


if __name__ == "__main__":
    unittest.main()
