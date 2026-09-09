from datetime import date, datetime, timezone


def serialize_temporal(value):
    """Serializa fechas civiles sin zona e instantes datetime en UTC explicito."""
    if isinstance(value, datetime):
        if value.tzinfo is None:
            utc_value = value.replace(tzinfo=timezone.utc)
        else:
            utc_value = value.astimezone(timezone.utc)

        return utc_value.isoformat().replace("+00:00", "Z")

    if isinstance(value, date):
        return value.isoformat()

    return value
