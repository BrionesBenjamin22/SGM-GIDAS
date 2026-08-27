# Modulo backend de dashboard

Genera el resumen institucional, distribuciones, series y alertas a partir de
datos agregados de los modulos de negocio.

## Contrato

Los filtros invalidos responden `VALIDATION_ERROR`. Una falla inesperada de
consulta o infraestructura se registra de forma sanitizada y responde
`INTERNAL_ERROR` con `request_id`, sin reflejar detalles internos.

## Permisos y pruebas

El resumen admite `ADMIN`, `GESTOR` y `LECTURA`.

- `tests/test_dashboard_domain_errors.py`
