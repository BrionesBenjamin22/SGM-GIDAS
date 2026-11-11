# Modulo backend de busqueda

## ISS-26: expositores de reuniones

La búsqueda de reuniones utiliza los nombres de `TrabajoReunionExpositor`, tanto
internos de todas las categorías como externos. El resultado entrega
`extra.expositores` con referencia, categoría, nombre e identidad; las autorías
legadas no se presentan bajo este encabezado. Revistas conserva `extra.autores`.
El registro de serialización y la consulta mantienen sus contratos generales,
permisos, filtros y límites existentes.

La adaptación se versiona sobre el buscador vigente. El refactor FTS, sus
proveedores, proyecciones, herramientas y migraciones locales de integración
permanecen en ISS-95 y requieren su aceptación independiente. La migración local
`d6a0c4e8b2f7` y `search_expositores_v1.sql` se versionarán junto a esas dependencias,
sin repetirlas sobre la base de desarrollo donde ya están instaladas.

Aceptado el 11/11/2026; pruebas de recuperación por personal y externos, separación
de autorías de revistas y ausencia de expositores deducidos de datos legados.

Los resultados de movimientos consultan `MovimientoFinanciero`, presentan número,
tipo y estado, y enlazan a `/movimientos/:id`. La búsqueda es global entre grupos;
la semilla de pruebas registra movimientos en la UCT activa para que también
figuren en el historial financiero visible.

Realiza busqueda global paginada sobre entidades habilitadas, con filtros de
estado, ordenamiento y limites configurables de consulta.

## Paginacion SQL (ISS-89)

`GET /api/v1/search` mantiene `query`, `orden`, `eliminados`,
`total_resultados`, `resultados` y `meta`. `search_pagination.py` arma una
union de candidatos de los modulos buscables, aplica texto, estado y alcance
UCT en SQL, cuenta todos los resultados y ordena antes de `LIMIT/OFFSET`.
`SearchService` carga las entidades y relaciones solo de la pagina solicitada.
Se conservan los ordenes `alf_asc`, `alf_desc`, `fecha_asc` y `fecha_desc`, los
permisos por entidad y los errores de validacion existentes.

Las pruebas de regresion incluyen mas de 300 coincidencias, orden entre
entidades, coincidencias con tildes y aislamiento UCT en
`tests/test_search_sql_pagination.py`.

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

## ISS-12: autoría de integrantes

Los trabajos en reuniones y revistas se recuperan por nombres de investigadores y becarios a través de autorías. El resultado expone extra.autores con id, rol, nombre_apellido, tipo y activo. Se actualizan las cargas ORM de trabajos e investigadores al esquema nuevo, manteniendo paginación y permisos.

Corrección de alcance ISS-12: los autores de trabajos son únicamente investigadores y becarios. Personal (PTAA/profesional) no puede vincularse como autor. Se mantiene la etiqueta Autores.

## ISS-13: fecha de presentación

Los resultados de trabajos en reuniones usan fecha_presentacion como fecha
de referencia del resultado y del registro del buscador. Identidad, autores,
paginación y permisos se conservan; fechas de otras entidades no cambian.
