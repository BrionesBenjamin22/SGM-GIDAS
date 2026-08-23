import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest.mock import patch

from config import _env_or_file, _require_production_security


class SecurityConfigTestCase(unittest.TestCase):

    def _make_config(self, **overrides):
        config = {
            "APP_ENV": "production",
            "SECRET_KEY": "x" * 40,
            "JWT_SECRET": "y" * 40,
            "REFRESH_SECRET": "z" * 40,
            "CORS_ORIGINS": ["https://gidas.example.com"],
            "RATELIMIT_STORAGE_URI": "redis://redis:6379/0",
        }
        config.update(overrides)
        return SimpleNamespace(**config)

    def test_rechaza_rate_limit_memory_en_produccion(self):
        config = self._make_config(RATELIMIT_STORAGE_URI="memory://")

        with self.assertRaisesRegex(RuntimeError, "almacenamiento compartido"):
            _require_production_security(config)

    def test_acepta_rate_limit_redis_en_produccion(self):
        config = self._make_config()

        with patch.dict("os.environ", {"DATABASE_URL": "postgresql://db"}):
            _require_production_security(config)

    def test_rechaza_wildcard_cors_en_produccion(self):
        config = self._make_config(CORS_ORIGINS=["*"])

        with self.assertRaisesRegex(RuntimeError, "no puede usar"):
            _require_production_security(config)

    def test_rechaza_origen_http_en_produccion(self):
        config = self._make_config(CORS_ORIGINS=["http://gidas.example.com"])

        with self.assertRaisesRegex(RuntimeError, "origenes HTTPS"):
            _require_production_security(config)

    def test_rechaza_origen_con_ruta_en_produccion(self):
        config = self._make_config(
            CORS_ORIGINS=["https://gidas.example.com/aplicacion"]
        )

        with self.assertRaisesRegex(RuntimeError, "sin rutas"):
            _require_production_security(config)

    def test_rechaza_secretos_reutilizados_en_produccion(self):
        shared_secret = "x" * 40
        config = self._make_config(
            SECRET_KEY=shared_secret,
            JWT_SECRET=shared_secret,
        )

        with self.assertRaisesRegex(RuntimeError, "deben ser independientes"):
            _require_production_security(config)

    def test_env_or_file_lee_secreto_montado(self):
        with TemporaryDirectory() as directory:
            secret_path = Path(directory) / "jwt_secret"
            secret_path.write_text("secreto-desde-archivo\n", encoding="utf-8")

            with patch.dict(
                "os.environ",
                {"JWT_SECRET_FILE": str(secret_path)},
                clear=False,
            ):
                with patch.dict("os.environ", {"JWT_SECRET": ""}, clear=False):
                    self.assertEqual(
                        _env_or_file("JWT_SECRET"),
                        "secreto-desde-archivo",
                    )

    def test_env_or_file_rechaza_archivo_vacio(self):
        with TemporaryDirectory() as directory:
            secret_path = Path(directory) / "empty_secret"
            secret_path.write_text("\n", encoding="utf-8")

            with patch.dict(
                "os.environ",
                {"REFRESH_SECRET": "", "REFRESH_SECRET_FILE": str(secret_path)},
                clear=False,
            ):
                with self.assertRaisesRegex(RuntimeError, "no puede estar vacio"):
                    _env_or_file("REFRESH_SECRET")


if __name__ == "__main__":
    unittest.main()
