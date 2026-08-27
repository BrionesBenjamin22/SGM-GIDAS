import logging
import json
import sys
import unittest

from flask import Flask

from modules.shared.services.logging_config import (
    SensitiveDataFilter,
    SafeTextFormatter,
    JsonFormatter,
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

        self.assertTrue(filtro.filter(record_token))
        self.assertTrue(filtro.filter(record_password))
        self.assertIn("[REDACTED]", record_token.getMessage())
        self.assertIn("[REDACTED]", record_password.getMessage())
        self.assertTrue(filtro.filter(record_seguro))

    def test_sensitive_filter_redacta_json_cookies_y_secretos_con_espacios(self):
        filtro = SensitiveDataFilter()
        record = logging.LogRecord(
            "test",
            logging.INFO,
            __file__,
            1,
            'payload={"refresh_token": "token privado", "cookie": "sid=abc"}',
            (),
            None,
        )

        self.assertTrue(filtro.filter(record))
        message = record.getMessage()
        self.assertNotIn("token privado", message)
        self.assertNotIn("sid=abc", message)
        self.assertEqual(message.count("[REDACTED]"), 2)

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

    def test_json_formatter_incluye_contexto_operativo(self):
        record = logging.LogRecord("test", logging.INFO, __file__, 1, "evento", (), None)
        payload = json.loads(JsonFormatter("gidas", "production", "abc123").format(record))
        self.assertEqual(payload["service"], "gidas")
        self.assertEqual(payload["environment"], "production")
        self.assertEqual(payload["version"], "abc123")
        self.assertEqual(payload["message"], "evento")

    def test_json_formatter_no_expone_detalle_de_excepcion_en_produccion(self):
        try:
            raise RuntimeError("password=secreto-operativo")
        except RuntimeError:
            exc_info = sys.exc_info()

        record = logging.LogRecord(
            "test", logging.ERROR, __file__, 1, "fallo", (), exc_info
        )
        payload = json.loads(
            JsonFormatter("gidas", "production", "abc123").format(record)
        )

        self.assertEqual(payload["exception_type"], "RuntimeError")
        self.assertNotIn("exception", payload)
        self.assertNotIn("secreto-operativo", json.dumps(payload))

    def test_text_formatter_redacta_detalle_sensible_de_excepcion(self):
        try:
            raise RuntimeError("password=secreto-operativo")
        except RuntimeError:
            exc_info = sys.exc_info()

        record = logging.LogRecord(
            "test", logging.ERROR, __file__, 1, "fallo", (), exc_info
        )
        output = SafeTextFormatter("%(message)s").format(record)

        self.assertIn("[REDACTED]", output)
        self.assertNotIn("secreto-operativo", output)

    def test_request_id_se_propaga_o_se_genera(self):
        app = Flask(__name__)
        register_request_logging(app)

        @app.get("/ping")
        def ping():
            return {"ok": True}

        supplied = app.test_client().get("/ping", headers={"X-Request-ID": "laboratorio-1"})
        generated = app.test_client().get("/ping")
        self.assertEqual(supplied.headers["X-Request-ID"], "laboratorio-1")
        self.assertTrue(generated.headers["X-Request-ID"])

    def test_request_id_invalido_no_se_refleja(self):
        app = Flask(__name__)
        register_request_logging(app)

        @app.get("/ping")
        def ping():
            return {"ok": True}

        response = app.test_client().get(
            "/ping", headers={"X-Request-ID": "valor con espacios"}
        )

        self.assertNotEqual(response.headers["X-Request-ID"], "valor con espacios")


if __name__ == "__main__":
    unittest.main()
