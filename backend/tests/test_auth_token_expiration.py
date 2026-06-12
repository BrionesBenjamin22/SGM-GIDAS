import datetime
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import jwt

from config import Config, _parse_int_env_range
from modules.auth.services.auth_service import AuthService


class AuthTokenExpirationTestCase(unittest.TestCase):

    def _make_user(self):
        return SimpleNamespace(
            id=7,
            nombre_usuario="usuario.test",
            rol=SimpleNamespace(nombre="GESTOR"),
        )

    def test_generate_tokens_usa_expiracion_configurada(self):
        with patch.object(Config, "JWT_EXPIRATION_MINUTES", 15):
            before = datetime.datetime.utcnow()
            tokens = AuthService.generate_tokens(self._make_user())
            after = datetime.datetime.utcnow()

        payload = jwt.decode(
            tokens["access_token"],
            Config.JWT_SECRET,
            algorithms=[Config.JWT_ALGORITHM],
        )
        expires_at = datetime.datetime.utcfromtimestamp(payload["exp"])

        self.assertGreaterEqual(
            expires_at,
            before + datetime.timedelta(minutes=15, seconds=-1),
        )
        self.assertLessEqual(
            expires_at,
            after + datetime.timedelta(minutes=15, seconds=1),
        )

    def test_parse_int_env_range_rechaza_valor_invalido(self):
        with patch.dict("os.environ", {"JWT_EXPIRATION_MINUTES": "abc"}):
            with self.assertRaisesRegex(RuntimeError, "numero entero"):
                _parse_int_env_range("JWT_EXPIRATION_MINUTES", 60, 5, 1440)

    def test_parse_int_env_range_rechaza_valor_fuera_de_rango(self):
        with patch.dict("os.environ", {"JWT_EXPIRATION_MINUTES": "2"}):
            with self.assertRaisesRegex(RuntimeError, "entre 5 y 1440"):
                _parse_int_env_range("JWT_EXPIRATION_MINUTES", 60, 5, 1440)


if __name__ == "__main__":
    unittest.main()
