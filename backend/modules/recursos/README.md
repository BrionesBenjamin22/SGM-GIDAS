# Recursos

## Becas activas por año (ISS-84)

`GET /api/v1/recursos/becas/activas?anio=YYYY` requiere un año valido y
devuelve las becas activas con al menos una vinculacion vigente durante ese
año. Excluye becas, becarios y vinculaciones con baja logica, respeta la UCT
del usuario y devuelve cada beca una sola vez. Sin `anio` o con un valor
invalido responde HTTP 400 mediante el contrato general de errores.

El contrato vigente de ingresos, egresos, saldo, auditoría, permisos y API está en
[MOVIMIENTOS.md](MOVIMIENTOS.md). El modelo y las rutas antiguas de erogaciones no
forman parte del contrato público actual.

La denominación del equipamiento debe contener una letra. Montos y fechas
mantienen sus validaciones propias.

## Contrato de fechas

Equipamiento, erogaciones, becas y sus relaciones se validan desde el
01/01/2010, conservando los límites futuros específicos de cada entidad.

## Funcionalidad

El modulo administra equipamiento, becas y movimientos financieros. Cada
entidad separa rutas, controladores, servicios y modelos, y aplica permisos por rol
en sus endpoints.

## Equipamiento

Los endpoints de equipamiento se publican bajo `/api/v1/recursos/equipamiento`:

- `GET /` y `GET /<id>`: consulta para `ADMIN`, `GESTOR` y `LECTURA`;
- `GET /<id>/historial`: historial de cambios para los mismos roles;
- `POST /`, `PUT /<id>` y `DELETE /<id>`: mutaciones para `ADMIN` y `GESTOR`.

El home de Equipamientos consulta el historial existente al expandir una fila;
el detalle también consume ese endpoint. La estandarización visual ISS-38 no
modificó rutas, payloads, permisos, validaciones ni persistencia del backend.

El payload de alta requiere `denominacion`, `descripcion_breve`,
`fecha_incorporacion`, `monto_invertido` y `grupo_utn_id`. La edicion acepta solo
los campos modificados.

`fecha_incorporacion` usa formato `YYYY-MM-DD` y debe estar comprendida entre
`2010-01-01` y la fecha actual, ambos limites inclusive. La regla se aplica en el
service tanto al crear como al editar; una fecha fuera del rango devuelve un error
de validacion y no se persiste. Los cambios reales se registran en la auditoria de
`equipamiento_grupo` y alimentan el historial consumido por el frontend.

La eliminacion es logica. Los snapshots de memoria conservan los datos del
equipamiento correspondientes al periodo versionado para mantener trazabilidad.

Un equipamiento activo puede vincularse con un solo egreso de su UCT. La
relación conserva el monto del egreso como importe histórico aunque luego se
modifique `monto_invertido`. Un equipo vinculado no puede trasladarse a otra
UCT; la baja lógica del movimiento conserva el vínculo para la trazabilidad.

## Errores

La edición de movimientos acepta diferencias de fecha, monto y relaciones. La
fuente es obligatoria para ingresos y egresos; el egreso requiere categoría y
puede vincular equipamiento. El backend comprueba el saldo global y el de la
fuente, además de las relaciones, antes de guardar. Registra cada cambio real
en la auditoría y mantiene inmutables los snapshots de
Memorias ya creados.

Los controladores delegan en el contrato uniforme de errores. Los datos ausentes,
formatos invalidos, montos no positivos, grupos inexistentes y fechas fuera del
rango se responden como errores de validacion sin exponer detalles internos.

ISS-19: equipamiento identifica `denominacion`, `descripcion_breve`, `monto_invertido` y `fecha_incorporacion` en `error.details.fields`. Movimientos identifica `tipo_movimiento`, `fecha`, `monto`, `fuente_financiamiento_id`, `categoria_erogacion_id` y `equipamiento_id` según corresponda. Los conflictos de saldo o de vínculo duplicado responden HTTP 409.

## Snapshots de memorias (ISS-16)

Equipamiento y movimientos se filtran por UCT. Equipamiento usa solapamiento entre incorporación, baja y período; movimientos usan su fecha puntual inclusiva. Una baja posterior no elimina un hecho histórico que correspondía al período.
