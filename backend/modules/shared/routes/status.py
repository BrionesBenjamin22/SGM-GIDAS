from flask import Blueprint
from extension import limiter
from modules.shared.controllers.responses import success_response

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
@limiter.exempt
def health():
    return success_response({"status": "ok"})
