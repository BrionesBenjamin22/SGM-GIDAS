import logging
import unittest

from flask import Flask

from modules.shared.services.logging_config import (
    SensitiveDataFilter,
    configure_logging,
    get_logger,
    register_request_logging,
    resolve_log_level,
)


class LoggingConfigTestCase(unittest.TestCase):

    def test_resolve_log_level_usa_info_por_defecto(self):
        self.assertEqual(resolve_log_level(None), logging.INFO)
        self.assertEqual(resolve_log_level("valor-invalido"), logging.INFO)

    def test_resolve_log_level_acepta_warning(self):
        self.assertEqual(resolve_log_level("WARNING"), logging.WARNING)

    def test_sensitive_filter_descarta_tokens_y_passwords(self):
        filtro = SensitiveDataFilter()

        record_token = logging.LogRecord(
            "test", logging.INFO, __file__, 1, "Bearer abc", (), None
        )
        record_password = logging.LogRecord(
            "test", logging.INFO, __file__, 1, "password=secreto", (), None
        )
        record_seguro = logging.LogRecord(
            "test", logging.INFO, __file__, 1, "Operacion completada", (), None
        )

        self.assertFalse(filtro.filter(record_token))
        self.assertFalse(filtro.filter(record_password))
        self.assertTrue(filtro.filter(record_seguro))

    def test_configure_logging_define_handler_y_nivel(self):
        logger = configure_logging(app_env="testing", log_level="ERROR")

        self.assertEqual(logger.level, logging.ERROR)
        self.assertEqual(len(logger.handlers), 1)

    def test_get_logger_devuelve_logger_del_modulo(self):
        logger = get_logger("modulo.prueba")

        self.assertEqual(logger.name, "modulo.prueba")

    def test_register_request_logging_registra_todos_los_endpoints(self):
        app = Flask(__name__)
        register_request_logging(app)

        @app.route("/ping")
        def ping():
            return {"ok": True}

        with self.assertLogs("gidas.request", level="INFO") as logs:
            response = app.test_client().get("/ping?token=no-debe-loguearse")

        self.assertEqual(response.status_code, 200)
        self.assertIn("method=GET", logs.output[0])
        self.assertIn("path=/ping", logs.output[0])
        self.assertIn("status=200", logs.output[0])
        self.assertNotIn("token=no-debe-loguearse", logs.output[0])


if __name__ == "__main__":
    unittest.main()
