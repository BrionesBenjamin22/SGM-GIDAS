# Borradores de formularios

El backend guarda un único borrador por usuario, módulo y registro en `form_draft`.
Un `PUT` reemplaza la última versión del mismo elemento. Los datos viven en la base
de datos y vencen a los siete días. La lista muestra metadatos, nunca el contenido.
Para borradores de Personal, Becario e Investigador, la lista incluye
`display_name` cuando el nombre del borrador contiene solo letras y espacios.
El resto de los campos del formulario no se expone en el listado.

## Endpoints

Todos requieren un access token válido y rol `ADMIN` o `GESTOR`.

- `GET /api/v1/borradores`: lista los borradores vigentes del usuario.
- `GET /api/v1/borradores/<module>/<record_key>`: devuelve datos de un borrador propio.
- `PUT /api/v1/borradores/<module>/<record_key>`: guarda `{ "data": { ... } }`.
- `DELETE /api/v1/borradores/<module>/<record_key>`: descarta un borrador propio.

`record_key` es `new` o un ID entero positivo. Los módulos permitidos y sus rutas
de retorno están en `services/form_draft_service.py`. El cuerpo no puede superar
64 KiB, tener más de 12 niveles ni contener claves de credenciales. Los errores
usan el contrato general de respuestas. La entidad sigue validándose al guardar
definitivamente; el borrador no concede permisos de edición sobre ella.

El frontend envía `data.__draft_meta.schema=1` y una huella de los valores
originales junto con `data.fields`. El backend guarda ese JSON sin interpretar
la huella y valida claves sensibles en toda la estructura. Los borradores
vencidos se ocultan de inmediato y se eliminan al consultar o guardar borradores
del usuario. Una fila de un usuario que nunca regrese permanece hasta una
limpieza operativa de la base.

La migración `a1d7c9e2f4b6` crea la tabla y sus índices. Debe ejecutarse con el
servicio `migrate`, que utiliza un rol con permisos DDL; el rol de la aplicación
no tiene permiso para crear tablas.

El listado de borradores incluye opcionalmente `display_name`, derivado de
campos de identificacion ya guardados (nombre, titulo, denominacion, evento
o numero, segun modulo). La lista sigue omitiendo `data` y solo el usuario
propietario puede consultarla. El valor se normaliza y limita a 120 caracteres.
