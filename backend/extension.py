from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Instancia de SQLAlchemy compartida
db = SQLAlchemy()
migrate = Migrate()
limiter = Limiter(key_func=get_remote_address, headers_enabled=True)
