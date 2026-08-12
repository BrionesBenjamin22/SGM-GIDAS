from flask import Blueprint, current_app
import socket
from urllib.parse import urlparse
from sqlalchemy import text

from extension import db, limiter
from modules.shared.controllers.responses import error_response, success_response


health_bp = Blueprint("health", __name__)


def check_database() -> None:
    db.session.execute(text("SELECT 1"))


def check_redis() -> None:
    storage_uri = current_app.config["RATELIMIT_STORAGE_URI"]
    if storage_uri.startswith("redis://") or storage_uri.startswith("rediss://"):
        parsed = urlparse(storage_uri)
        if parsed.scheme == "rediss":
            raise RuntimeError("readiness TLS de Redis requiere un cliente configurado")
        with socket.create_connection((parsed.hostname, parsed.port or 6379), timeout=2) as connection:
            connection.sendall(b"*1\r\n$4\r\nPING\r\n")
            if not connection.recv(16).startswith(b"+PONG"):
                raise RuntimeError("Redis no respondio PONG")


@health_bp.route("/health", methods=["GET"])
@health_bp.route("/health/live", methods=["GET"])
@limiter.exempt
def health():
    return success_response({"status": "ok"})


@health_bp.route("/health/ready", methods=["GET"])
@limiter.exempt
def readiness():
    dependencies = {"database": "ok", "redis": "ok"}
    try:
        check_database()
    except Exception:
        dependencies["database"] = "unavailable"
    try:
        check_redis()
    except Exception:
        dependencies["redis"] = "unavailable"

    if "unavailable" in dependencies.values():
        return error_response(
            "SERVICE_UNAVAILABLE",
            "Lo sentimos, el servicio no está disponible temporalmente. Intente nuevamente.",
            details={"dependencies": dependencies},
            status_code=503,
        )
    return success_response({"status": "ready", "dependencies": dependencies})
