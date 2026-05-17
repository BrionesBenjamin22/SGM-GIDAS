import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
env_file = os.getenv("ENV_FILE", ".env.local")
load_dotenv(os.path.join(basedir, env_file))


def _parse_csv_env(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY") 
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


class DevelopmentConfig(Config):
    DEBUG = True
    CORS_ORIGINS = "*"

class DockerConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
