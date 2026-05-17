from flask import Flask, jsonify
from extension import db, migrate, limiter
from flask_cors import CORS
from config import DevelopmentConfig
import logging
from core.routes import blueprints
from core.models.audit_mixin import AuditMixin
from werkzeug.middleware.proxy_fix import ProxyFix


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)
    app.config.from_object(DevelopmentConfig)
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
        return jsonify({
            "error": "Demasiadas solicitudes. Intenta nuevamente en unos minutos."
        }), 429

    logger.info("Aplicación inicializada. Usa 'flask db upgrade' para crear/migrar tablas.")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
