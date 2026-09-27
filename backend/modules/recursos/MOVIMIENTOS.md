# Movimientos financieros: contrato backend

## Modelo y reglas

`MovimientoFinanciero` registra un único `INGRESO` o `EGRESO` por fila. La numeración positiva es única dentro de `grupo_utn_id` y la asigna el servicio bajo bloqueo del grupo. `fecha` es civil, `monto` es decimal positivo de hasta dos decimales y `moneda` se fija en `ARS` en esta etapa. El esquema admite `USD`, pero su carga y conversión quedan pendientes; el saldo consolidado rechaza movimientos sin conversión.

Un ingreso requiere `fuente_financiamiento_id` y excluye categoría. Un egreso requiere `categoria_erogacion_id` y excluye fuente. Las categorías estructuradas son `CORRIENTE` y `CAPITAL`. El tipo, grupo, número y moneda no son editables. `AuditMixin` conserva autoría, fechas y baja lógica; `AuditoriaService` registra cambios de campos. `MovimientoMemoriaVersion` guarda una foto inmutable del movimiento, grupo, fuente y categoría al versionar una memoria.

El saldo de una UCT se deriva de sus movimientos activos: ingresos menos egresos. No se almacena como campo editable. Crear o aumentar un egreso se rechaza con `409 CONFLICT` si supera el saldo disponible; en edición se reintegra primero el monto anterior. Reducir o eliminar un ingreso se rechaza si dejaría saldo negativo. La baja de un egreso aumenta el saldo. Las escrituras bloquean la fila del grupo para serializar numeración y validación financiera.

## API

Prefijo público: `/api/v1/recursos/movimientos`. `ADMIN`, `GESTOR` y `LECTURA` pueden consultar; solo `ADMIN` y `GESTOR` pueden escribir.

| Método y ruta | Respuesta o propósito |
| --- | --- |
| `GET /?activos=true|false|all&grupo_utn_id=<id>` | Listado ordenado por fecha y número; estado activo por defecto. |
| `GET /<id>` | Movimiento, relaciones, estado y auditoría. |
| `GET /<id>/historial` | Cambios auditados. |
| `GET /categorias` | Categorías activas. |
| `GET /grupos/<id>/resumen` | `moneda`, `saldo_disponible`, `total_ingresos`, `total_egresos`, `cantidad_movimientos`, con importes como cadenas decimales. |
| `POST /` | Alta; asigna `numero_movimiento`. |
| `PUT /<id>` | Edición de diferencias permitidas. |
| `DELETE /<id>` | Baja lógica con control de saldo. |

Alta de ingreso: `{"grupo_utn_id":1,"tipo_movimiento":"INGRESO","fecha":"2026-09-26","monto":"100.00","fuente_financiamiento_id":1}`. Para un egreso se usa `tipo_movimiento: "EGRESO"` y `categoria_erogacion_id` en lugar de fuente. La edición admite únicamente `fecha`, `monto`, `fuente_financiamiento_id` para ingresos y `categoria_erogacion_id` para egresos. Las respuestas exponen `numero_movimiento`, `tipo_movimiento`, `monto`, `moneda`, `grupo`, `fuente` o `categoria_erogacion`, estado y auditoría. Errores de validación usan `400`, registros ausentes `404`, conflictos financieros `409` y permisos insuficientes `403`; los campos corregibles se informan en `error.details.fields`.

## Integraciones y datos de prueba

Dashboard, búsqueda, snapshots y exportación de Memorias consumen el modelo nuevo. La exportación separa ingresos y egresos corrientes/de capital. Las rutas públicas del módulo anterior están desregistradas; sus modelos y tablas permanecen internamente como legado temporal. No se migraron registros históricos porque el usuario confirmó que los datos del entorno son ficticios. La migración `e3a7d9b2c4f1` crea el esquema y categorías; `tools/seed_testing_data.py` utiliza la UCT activa que presenta el sistema para evitar movimientos buscables fuera del historial visible. La aplicación y el migrador mantienen sus roles de base separados en Docker Compose.

Las pruebas del dominio cubren montos, numeración por grupo, aislamiento del listado, permisos, saldo insuficiente, baja, auditoría y snapshots; la prueba manual de UI corresponde al usuario.
