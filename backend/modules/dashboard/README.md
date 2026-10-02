# Modulo backend de dashboard

El resumen financiero consulta `MovimientoFinanciero` y
`SaldoFinancieroService`: ingresos, egresos y saldo ARS derivan de movimientos
activos; los egresos se agrupan por categoría `CORRIENTE` o `CAPITAL`. No utiliza
las columnas separadas del modelo anterior. El contrato de la API conserva las
claves públicas del resumen.

Genera el resumen institucional, distribuciones, series y alertas a partir de
datos agregados de los modulos de negocio.

## Contrato

Los filtros invalidos responden `VALIDATION_ERROR`. Una falla inesperada de
consulta o infraestructura se registra de forma sanitizada y responde
`INTERNAL_ERROR` con `request_id`, sin reflejar detalles internos.

## Permisos y pruebas

El resumen admite `ADMIN`, `GESTOR` y `LECTURA`.

- `tests/test_dashboard_domain_errors.py`
