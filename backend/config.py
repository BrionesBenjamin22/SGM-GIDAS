import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
env_file = os.getenv("ENV_FILE", ".env.local")
load_dotenv(os.path.join(basedir, env_file))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY") or "gidas-dev-secret-key-do-not-use-in-production-2024"
    FRONTEND_URL = os.getenv("FRONTEND_URL") or "http://localhost:5173"

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


class DevelopmentConfig(Config):
    DEBUG = True

class DockerConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False