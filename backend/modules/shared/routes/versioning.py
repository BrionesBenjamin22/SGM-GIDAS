API_VERSION = "v1"
API_VERSION_HEADER = "API-Version"
API_V1_PREFIX = "/api/v1"


def register_blueprints(app, blueprints):
    for blueprint in blueprints:
        app.register_blueprint(blueprint)
        app.register_blueprint(
            blueprint,
            name=f"{API_VERSION}_{blueprint.name}",
            url_prefix=_versioned_prefix(blueprint),
        )


def register_api_version_header(app):
    @app.after_request
    def add_api_version_header(response):
        if request_path_is_versioned():
            response.headers.setdefault(API_VERSION_HEADER, API_VERSION)
        return response


def request_path_is_versioned():
    from flask import request

    return request.path == API_V1_PREFIX or request.path.startswith(
        f"{API_V1_PREFIX}/"
    )


def _versioned_prefix(blueprint):
    legacy_prefix = getattr(blueprint, "url_prefix", None) or ""
    return f"{API_V1_PREFIX}{legacy_prefix}"
