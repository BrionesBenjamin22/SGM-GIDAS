# Recursos

La denominación del equipamiento debe contener una letra. Montos y fechas
mantienen sus validaciones propias.

## Contrato de fechas

Equipamiento, erogaciones, becas y sus relaciones se validan desde el
01/01/2010, conservando los límites futuros específicos de cada entidad.

## Funcionalidad

El modulo administra equipamiento, becas, erogaciones y tipos de erogacion. Cada
entidad separa rutas, controladores, servicios y modelos, y aplica permisos por rol
en sus endpoints.

## Equipamiento

Los endpoints de equipamiento se publican bajo `/api/v1/recursos/equipamiento`:

- `GET /` y `GET /<id>`: consulta para `ADMIN`, `GESTOR` y `LECTURA`;
- `GET /<id>/historial`: historial de cambios para los mismos roles;
- `POST /`, `PUT /<id>` y `DELETE /<id>`: mutaciones para `ADMIN` y `GESTOR`.

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

La edicion de erogaciones acepta diferencias de `numero_erogacion`,
`tipo_erogacion_id`, `fuente_financiamiento_id`, `fecha`, `ingresos` y
`egresos`. La fecha se vuelve a validar con el rango institucional, el numero
se comprueba dentro del grupo y los catalogos deben seguir disponibles. Cada
cambio real se registra en el historial de auditoria; los snapshots de memoria
ya creados conservan su version original.

Los controladores delegan en el contrato uniforme de errores. Los datos ausentes,
formatos invalidos, montos no positivos, grupos inexistentes y fechas fuera del
rango se responden como errores de validacion sin exponer detalles internos.

ISS-19: equipamiento identifica `denominacion`, `descripcion_breve`, `monto_invertido` y `fecha_incorporacion` en `error.details.fields`. Erogaciones identifica `numero_erogacion`, `egresos`, `ingresos`, `fecha`, `tipo_erogacion_id` y `fuente_financiamiento_id`. La edición valida ambos montos antes de modificar la entidad o registrar auditoría. Los conflictos de número conservan HTTP 409 y señalan el control correspondiente.

## Snapshots de memorias (ISS-16)

Equipamiento y erogaciones se filtran por UCT. Equipamiento usa solapamiento entre incorporación, baja y período; erogaciones usan su fecha puntual inclusiva. Una baja posterior no elimina un hecho histórico que correspondía al período.
