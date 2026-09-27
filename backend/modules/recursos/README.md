# Recursos

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

## Errores

La edición de movimientos acepta diferencias de fecha, monto y de la relación
correspondiente al tipo. El backend comprueba saldo y relaciones antes de guardar,
registra cada cambio real en la auditoría y mantiene inmutables los snapshots de
Memorias ya creados.

Los controladores delegan en el contrato uniforme de errores. Los datos ausentes,
formatos invalidos, montos no positivos, grupos inexistentes y fechas fuera del
rango se responden como errores de validacion sin exponer detalles internos.

ISS-19: equipamiento identifica `denominacion`, `descripcion_breve`, `monto_invertido` y `fecha_incorporacion` en `error.details.fields`. Movimientos identifica `tipo_movimiento`, `fecha`, `monto`, `fuente_financiamiento_id` y `categoria_erogacion_id` según corresponda. Los conflictos de saldo responden HTTP 409.

## Snapshots de memorias (ISS-16)

Equipamiento y movimientos se filtran por UCT. Equipamiento usa solapamiento entre incorporación, baja y período; movimientos usan su fecha puntual inclusiva. Una baja posterior no elimina un hecho histórico que correspondía al período.
