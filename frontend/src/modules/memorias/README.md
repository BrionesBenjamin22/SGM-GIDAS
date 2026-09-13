# Memorias

## Errores por campo (ISS-09)

Los formularios del módulo consumen `error.details.fields` mediante
`applyFieldErrors` de `src/lib/httpError.ts`, muestran el mensaje junto al control
y enfocan el primer campo inválido. Los nombres locales de los controles se
vinculan con las claves API, sin cambiar el payload del service ni los permisos.
Los errores sin campo o con campos desconocidos conservan el aviso general;
los errores inesperados muestran una referencia de seguimiento cuando existe.
Se conservan las reglas y el momento de validación existentes. Véase el contrato
transversal en `../README.md`.

## Fechas

Los períodos informados por las memorias admiten fechas desde el 01/01/2010 y
mantienen la coherencia cronológica y anual definida por el módulo.

## Funcionalidad

El modulo administra memorias, sus versiones, cambios de estado, reaperturas,
snapshots historicos y exportacion Excel. El home pagina hasta 9 elementos y el
alta vuelve al home con `successMessage`.

## Vistas y permisos

- `MemoriasHome`: listado, filtros y baja logica; la creacion y eliminacion son
  exclusivas de administradores.
- `MemoriaForm`: alta con validacion de periodos.
- `MemoriaDetalle`: auditoria, versiones y cambios de estado.
- `MemoriaVersionDetalle`: consulta de snapshots y exportacion.

Los permisos visuales complementan, pero no reemplazan, los controles del backend.

## Servicios y contratos

`memoriasService.ts` concentra CRUD, estados, reapertura, snapshots y descarga.
Las respuestas de error se interpretan mediante `getErrorMessage`, compatible con
el contrato tipado `{ data, error: { code, message, details } }` y contratos
heredados. Cuerpos de texto no estructurados no se muestran al usuario.

## Validaciones y errores

- El fin del periodo no puede ser anterior al inicio.
- Las exportaciones vacias se rechazan y siempre revocan la URL temporal.
- Los fallos de guardado y eliminacion muestran mensajes accionables.
- El detalle inexistente se representa como ausencia de datos sin exponer detalles
  internos.
