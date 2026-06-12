from flask import current_app


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
