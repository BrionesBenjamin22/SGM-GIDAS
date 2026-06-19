from datetime import date, datetime


def validar_fecha_alta_grupo(
    valor,
    campo: str = "fecha_alta_grupo",
    permitir_none: bool = False
):
    if valor in (None, ""):
        if permitir_none:
            return None
        raise ValueError(
            f"El campo '{campo}' es obligatorio y debe tener formato YYYY-MM-DD"
        )

    if isinstance(valor, date) and not isinstance(valor, datetime):
        return valor

    if isinstance(valor, str):
        try:
            return datetime.strptime(valor.strip(), "%Y-%m-%d").date()
        except ValueError:
            pass

    raise ValueError(
        f"El campo '{campo}' es obligatorio y debe tener formato YYYY-MM-DD"
    )


def esta_en_periodo_memoria(memoria_version, fecha_referencia):
    if fecha_referencia is None:
        return False

    memoria = getattr(memoria_version, "memoria", None)
    if memoria is None:
        # Permite tests unitarios aislados donde la version se instancia sin
        # relacion cargada. En runtime la version siempre conoce a su memoria.
        return True

    periodo_inicio = getattr(memoria, "periodo_inicio", None)
    periodo_fin = getattr(memoria, "periodo_fin", None)

    if periodo_inicio is None or periodo_fin is None:
        return True

    return periodo_inicio <= fecha_referencia <= periodo_fin


def _normalizar_fecha(valor):
    if valor is None:
        return None

    if isinstance(valor, datetime):
        return valor.date()

    if isinstance(valor, date):
        return valor

    return None


def estuvo_activo_en_periodo_memoria(
    memoria_version,
    fecha_alta,
    fecha_baja=None
):
    fecha_alta = _normalizar_fecha(fecha_alta)
    fecha_baja = _normalizar_fecha(fecha_baja)

    if fecha_alta is None:
        return False

    memoria = getattr(memoria_version, "memoria", None)
    if memoria is None:
        return True

    periodo_inicio = getattr(memoria, "periodo_inicio", None)
    periodo_fin = getattr(memoria, "periodo_fin", None)

    if periodo_inicio is None or periodo_fin is None:
        return True

    return fecha_alta <= periodo_fin and (
        fecha_baja is None or fecha_baja >= periodo_inicio
    )


# Alias temporal para acompanar la migracion del dominio.
validar_fecha_ingreso_grupo = validar_fecha_alta_grupo
