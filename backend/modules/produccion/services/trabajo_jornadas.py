"""Fechas civiles de reuniones, sin inferir jornadas en los huecos."""
from datetime import date, timedelta

from modules.shared.exceptions import ValidationError


def error_fechas(message):
    raise ValidationError("Revise los campos indicados e intente nuevamente.",
                          details={"fields": {"fechas_presentacion": message}})


def normalizar_fechas(values):
    if not isinstance(values, list) or not values:
        error_fechas("Seleccione al menos una jornada del evento.")
    dates = set()
    for value in values:
        try:
            if not isinstance(value, str) or len(value) != 10:
                raise ValueError()
            parsed = date.fromisoformat(value)
            if parsed.isoformat() != value or parsed < date(2010, 1, 1):
                raise ValueError()
        except (ValueError, TypeError):
            error_fechas("Ingrese fechas válidas desde el 01/01/2010, en formato AAAA-MM-DD.")
        dates.add(parsed)
    return sorted(dates)


def fechas_trabajo(trabajo):
    return sorted({j.fecha for j in getattr(trabajo, "jornadas", [])}) or [trabajo.fecha_presentacion]


def resolver_fechas(data, actual=None):
    scalars = [data[key] for key in ("fecha_presentacion", "fecha_inicio") if key in data]
    if scalars and any(value != scalars[0] for value in scalars):
        error_fechas("Las fechas enviadas no coinciden.")
    if "fechas_presentacion" in data:
        dates = normalizar_fechas(data["fechas_presentacion"])
        if scalars and normalizar_fechas([scalars[0]])[0] != dates[0]:
            error_fechas("La fecha de presentación debe coincidir con la primera jornada.")
        return dates
    if scalars:
        if actual is not None and len(fechas_trabajo(actual)) > 1:
            error_fechas("Este evento tiene varias jornadas. Envíe todas sus fechas para modificarlas.")
        return normalizar_fechas([scalars[0]])
    if actual is not None:
        return fechas_trabajo(actual)
    return normalizar_fechas(None)


def fechas_texto(values):
    dates = sorted({date.fromisoformat(v) if isinstance(v, str) else v for v in values})
    ranges = []
    for value in dates:
        if ranges and value == ranges[-1][1] + timedelta(days=1):
            ranges[-1][1] = value
        else:
            ranges.append([value, value])
    return "; ".join(start.strftime("%d/%m/%Y") if start == end else
                     f"{start:%d/%m/%Y} – {end:%d/%m/%Y}" for start, end in ranges)


def fecha_exportacion(item):
    if isinstance(item, dict):
        values = item.get("fechas_presentacion") or [item.get("fecha_presentacion")]
    else:
        values = fechas_trabajo(item)
    values = [value for value in values if value]
    if len(values) == 1:
        return date.fromisoformat(values[0]) if isinstance(values[0], str) else values[0]
    return fechas_texto(values)
