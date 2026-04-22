from flask import Flask
from extension import db, migrate
from flask_cors import CORS
from config import DevelopmentConfig
import logging
from core.routes import blueprints
from core.models.audit_mixin import AuditMixin


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)
    app.config.from_object(DevelopmentConfig)

    CORS(
        app,
        resources={r"/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }},
        supports_credentials=True
    )

    db.init_app(app)
    migrate.init_app(app, db)


    for bp in blueprints:
        app.register_blueprint(bp)

    logger.info("Aplicación inicializada. Usa 'flask db upgrade' para crear/migrar tablas.")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)