from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Instancia de SQLAlchemy compartida
db = SQLAlchemy()
migrate = Migrate()