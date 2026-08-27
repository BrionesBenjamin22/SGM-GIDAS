# Memorias

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
