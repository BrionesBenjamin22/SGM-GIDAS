import os
import secrets
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
env_file = os.getenv("ENV_FILE", ".env.local")
load_dotenv(os.path.join(basedir, env_file))


def _parse_csv_env(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _is_insecure_secret(value: str | None) -> bool:
    if not value:
        return True
    normalized = value.strip().lower()
    insecure_values = {
        "change-me",
        "changeme",
        "replace-with-secure-secret",
        "secret",
        "dev-secret",
        "test-secret",
    }
    return normalized in insecure_values or len(value.strip()) < 32


def _require_production_security(config_class):
    if config_class.APP_ENV not in {"production", "prod"}:
        return

    required_secrets = {
        "SECRET_KEY": config_class.SECRET_KEY,
        "JWT_SECRET": config_class.JWT_SECRET,
        "REFRESH_SECRET": config_class.REFRESH_SECRET,
    }
    missing_or_insecure = [
        key for key, value in required_secrets.items() if _is_insecure_secret(value)
    ]

    if missing_or_insecure:
        raise RuntimeError(
            "Configuracion insegura para produccion. Revise: "
            + ", ".join(missing_or_insecure)
        )

    if config_class.CORS_ORIGINS == "*" or "*" in config_class.CORS_ORIGINS:
        raise RuntimeError("CORS_ORIGINS no puede usar '*' en produccion")

    if not os.getenv("DATABASE_URL"):
        raise RuntimeError("DATABASE_URL es obligatorio en produccion")


class Config:
    APP_ENV = os.getenv("APP_ENV", "local")
    SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_urlsafe(48)
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    FRONTEND_URLS = _parse_csv_env(os.getenv("FRONTEND_URLS")) or [FRONTEND_URL]
    CORS_ORIGINS = FRONTEND_URLS

    MAIL_SERVER = os.getenv("MAIL_SERVER")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True") == "True"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/gidas_db"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = os.getenv("SQLALCHEMY_TRACK_MODIFICATIONS", "False") == "True"

    JWT_SECRET = os.getenv("JWT_SECRET") or SECRET_KEY
    REFRESH_SECRET = os.getenv("REFRESH_SECRET") or SECRET_KEY
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", 60))
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    RATELIMIT_DEFAULT = os.getenv("RATELIMIT_DEFAULT", "120 per minute")
    RATELIMIT_HEADERS_ENABLED = os.getenv("RATELIMIT_HEADERS_ENABLED", "True") == "True"

    AUTH_LOGIN_LIMIT = os.getenv("AUTH_LOGIN_LIMIT", "10 per minute")
    AUTH_REFRESH_LIMIT = os.getenv("AUTH_REFRESH_LIMIT", "30 per minute")
    AUTH_REGISTER_LIMIT = os.getenv("AUTH_REGISTER_LIMIT", "5 per hour")
    AUTH_CHANGE_PASSWORD_LIMIT = os.getenv("AUTH_CHANGE_PASSWORD_LIMIT", "10 per hour")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "False") == "True"


class DevelopmentConfig(Config):
    DEBUG = True
    CORS_ORIGINS = "*"

class DockerConfig(Config):
    DEBUG = os.getenv("FLASK_DEBUG", "False") == "True"

class TestingConfig(Config):
    DEBUG = False

class ProductionConfig(Config):
    DEBUG = False
    SESSION_COOKIE_SECURE = True


CONFIG_BY_ENV = {
    "local": DevelopmentConfig,
    "development": DevelopmentConfig,
    "docker": DockerConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "prod": ProductionConfig,
}


def get_config_class():
    app_env = os.getenv("APP_ENV", "local").strip().lower()
    config_class = CONFIG_BY_ENV.get(app_env, DevelopmentConfig)
    _require_production_security(config_class)
    return config_class
