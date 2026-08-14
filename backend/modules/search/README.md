# Modulo backend de busqueda

Realiza busqueda global paginada sobre entidades habilitadas, con filtros de
estado, ordenamiento y limites configurables de consulta.

## Contrato de errores

Los parametros invalidos responden `VALIDATION_ERROR`. Las fallas inesperadas
de consulta responden `INTERNAL_ERROR` con `request_id` y no exponen mensajes de
drivers, SQL ni infraestructura.

## Pruebas

- `tests/test_search.py`
