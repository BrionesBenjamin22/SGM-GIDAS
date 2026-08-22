from flask import request

from modules.shared.controllers.responses import error_response


BODY_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def _request_has_body() -> bool:
    content_length = request.content_length
    return (
        content_length is not None and content_length > 0
    ) or bool(request.headers.get("Transfer-Encoding"))


def register_request_body_security(app):
    @app.before_request
    def _validate_api_request_body():
        if (
            request.url_rule is None
            or not request.path.startswith("/api/")
            or request.method not in BODY_METHODS
        ):
            return None

        if not _request_has_body():
            return None

        if not request.is_json:
            return error_response("UNSUPPORTED_MEDIA_TYPE", status_code=415)

        request.max_content_length = min(
            app.config["MAX_CONTENT_LENGTH"],
            app.config["MAX_JSON_CONTENT_LENGTH"],
        )
        return None

    return app
