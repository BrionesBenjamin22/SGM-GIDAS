import logging
import sys
import time

from flask import g, request


LOG_FORMAT = (
    "%(asctime)s %(levelname)s [%(name)s] "
    "%(module)s.%(funcName)s:%(lineno)d - %(message)s"
)

SENSITIVE_LOG_TOKENS = (
    "authorization",
    "bearer ",
    "password",
    "contrasena",
    "token",
    "secret",
)


class SensitiveDataFilter(logging.Filter):
    def filter(self, record):
        message = record.getMessage().lower()
        return not any(token in message for token in SENSITIVE_LOG_TOKENS)


def resolve_log_level(raw_level):
    level_name = (raw_level or "INFO").strip().upper()
    return getattr(logging, level_name, logging.INFO)


def get_logger(name):
    return logging.getLogger(name)


def configure_logging(app_env="local", log_level="INFO"):
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(resolve_log_level(log_level))

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(LOG_FORMAT))
    handler.addFilter(SensitiveDataFilter())
    root_logger.addHandler(handler)

    if app_env in {"production", "prod"}:
        logging.getLogger("werkzeug").setLevel(logging.WARNING)

    return root_logger


def register_request_logging(app):
    request_logger = logging.getLogger("gidas.request")

    @app.before_request
    def _start_request_timer():
        g.request_started_at = time.perf_counter()

    @app.after_request
    def _log_request(response):
        started_at = getattr(g, "request_started_at", None)
        duration_ms = None
        if started_at is not None:
            duration_ms = round((time.perf_counter() - started_at) * 1000, 2)

        user_id = getattr(g, "current_user_id", None)
        user_role = getattr(g, "current_user_rol", None)
        request_logger.info(
            "request method=%s path=%s endpoint=%s status=%s duration_ms=%s user_id=%s role=%s",
            request.method,
            request.path,
            request.endpoint,
            response.status_code,
            duration_ms,
            user_id,
            user_role,
        )
        return response

    return app
