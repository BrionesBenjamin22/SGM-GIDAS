from flask import Flask
from extension import db, migrate, limiter
from flask_cors import CORS
from config import get_config_class
from modules import blueprints
from modules import models_registry  # noqa: F401
from werkzeug.middleware.proxy_fix import ProxyFix
from modules.shared.controllers.pagination import register_legacy_list_pagination
from modules.shared.controllers.responses import error_response
from modules.shared.services.logging_config import (
    configure_logging,
    get_logger,
    register_request_logging,
)


logger = get_logger(__name__)


def create_app():
    app = Flask(__name__)
    app.config.from_object(get_config_class())
    configure_logging(app.config["APP_ENV"], app.config["LOG_LEVEL"])
    register_request_logging(app)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    CORS(
        app,
        resources={r"/*": {
            "origins": app.config["CORS_ORIGINS"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }},
        supports_credentials=True
    )

    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)


    for bp in blueprints:
        app.register_blueprint(bp)

    @app.errorhandler(429)
    def ratelimit_handler(_error):
        return error_response(
            "RATE_LIMIT_EXCEEDED",
            message="Lo sentimos, recibimos demasiadas solicitudes. Intente nuevamente en unos minutos.",
            status_code=429,
        )

    @app.after_request
    def add_security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy",
            "geolocation=(), microphone=(), camera=()"
        )
        if not app.config["DEBUG"]:
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains"
            )
        return response

    register_legacy_list_pagination(app)

    logger.info("Aplicación inicializada. Usa 'flask db upgrade' para crear/migrar tablas.")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=app.config["DEBUG"])
