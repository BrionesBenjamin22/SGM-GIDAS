# Recursos

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

Los controladores delegan en el contrato uniforme de errores. Los datos ausentes,
formatos invalidos, montos no positivos, grupos inexistentes y fechas fuera del
rango se responden como errores de validacion sin exponer detalles internos.

## Snapshots de memorias (ISS-16)

Equipamiento y erogaciones se filtran por UCT. Equipamiento usa solapamiento entre incorporación, baja y período; erogaciones usan su fecha puntual inclusiva. Una baja posterior no elimina un hecho histórico que correspondía al período.