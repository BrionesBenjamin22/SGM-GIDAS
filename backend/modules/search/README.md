# Modulo backend de busqueda

Realiza busqueda global paginada sobre entidades habilitadas, con filtros de
estado, ordenamiento y limites configurables de consulta.

## Contrato de errores

Los parametros invalidos responden `VALIDATION_ERROR`. Las fallas inesperadas
de consulta responden `INTERNAL_ERROR` con `request_id` y no exponen mensajes de
drivers, SQL ni infraestructura.

## Pruebas

- `tests/test_search.py`
- `tools/verify_search_retrieval.py`: verifica recuperacion, tipo e identificador
  para los 24 modulos registrados.

## Datos integrales de testing

`tools/seed_testing_data.py` crea datos ficticios e idempotentes para los 24
modulos de busqueda, incluidas sus relaciones obligatorias. El seed reutiliza
usuarios, grupo, personal y catalogos de testing, y nunca debe ejecutarse contra
una base productiva.

La ejecucion exige `APP_ENV=testing`. Para una base aislada de staging se debe
habilitar conscientemente `ALLOW_TEST_SEED=true` solo durante el comando de carga.
La variable no debe persistirse en archivos de entorno ni en Compose.

Despues de cargar los datos se ejecuta:

```text
python tools/verify_search_retrieval.py
```

El resultado esperado es `Recuperacion validada para 24 modulos.`. Ejecutar el
seed nuevamente no debe aumentar la cantidad de registros ficticios.
