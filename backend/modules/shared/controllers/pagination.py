from flask import current_app, request

from modules.shared.controllers.responses import error_response, paginated_response


DEFAULT_PAGE = 1
DEFAULT_PER_PAGE = 9
DEFAULT_MAX_PER_PAGE = 100
PAGINATION_PARAMS = {"page", "per_page"}
VALID_ACTIVOS_VALUES = {"true", "false", "all"}
VALID_ORDER_VALUES = {"asc", "desc"}


def pagination_requested(args) -> bool:
    return any(param in args for param in PAGINATION_PARAMS)


def _positive_int(value, field_name: str) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name} debe ser un numero entero positivo") from exc

    if parsed < 1:
        raise ValueError(f"{field_name} debe ser un numero entero positivo")

    return parsed


def parse_pagination_params(args):
    default_per_page = current_app.config.get(
        "PAGINATION_DEFAULT_PER_PAGE",
        DEFAULT_PER_PAGE,
    )
    max_per_page = current_app.config.get(
        "PAGINATION_MAX_PER_PAGE",
        DEFAULT_MAX_PER_PAGE,
    )

    page = _positive_int(args.get("page", DEFAULT_PAGE), "page")
    per_page = _positive_int(args.get("per_page", default_per_page), "per_page")

    if per_page > max_per_page:
        raise ValueError(f"per_page no puede superar {max_per_page}")

    activos = args.get("activos", "true").strip().lower()
    if activos not in VALID_ACTIVOS_VALUES:
        raise ValueError("activos debe ser true, false o all")

    orden = args.get("orden", "asc").strip().lower()
    if orden not in VALID_ORDER_VALUES:
        raise ValueError("orden debe ser asc o desc")

    return {
        "page": page,
        "per_page": per_page,
        "activos": activos,
        "orden": orden,
    }


def paginate_query(query, page: int, per_page: int):
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def paginate_list(items: list, page: int, per_page: int):
    total = len(items)
    start = (page - 1) * per_page
    end = start + per_page
    return items[start:end], total


def register_legacy_list_pagination(app):
    @app.after_request
    def paginate_legacy_list_response(response):
        if request.method != "GET":
            return response

        if not pagination_requested(request.args):
            return response

        if response.status_code != 200 or not response.is_json:
            return response

        payload = response.get_json(silent=True)
        if not isinstance(payload, list):
            return response

        try:
            params = parse_pagination_params(request.args)
        except ValueError as exc:
            error, status_code = error_response(
                "VALIDATION_ERROR",
                message=str(exc),
                status_code=400,
            )
            error.status_code = status_code
            return error

        data, total = paginate_list(
            payload,
            page=params["page"],
            per_page=params["per_page"],
        )
        paginated, _status_code = paginated_response(
            data,
            page=params["page"],
            per_page=params["per_page"],
            total=total,
            meta={
                "activos": params["activos"],
                "orden": params["orden"],
                "source": "legacy-list",
            },
        )
        return paginated
