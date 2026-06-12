import unittest
from types import SimpleNamespace
from unittest.mock import patch

from config import _require_production_security


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


if __name__ == "__main__":
    unittest.main()
