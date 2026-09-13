# Modulo frontend de proyectos

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

Los períodos de proyectos y de sus participaciones admiten fechas desde el
01/01/2010. Una fecha de finalización no puede preceder a su fecha de inicio;
los cierres conservan la prohibición de utilizar una fecha futura.

## Vistas

El modulo administra proyectos de investigacion y participaciones relevantes.
Los homes muestran hasta 9 elementos por pagina. Los detalles incluyen datos,
auditoria, historial paginado de 3 elementos, `Volver` y acciones condicionadas
por permisos y estado activo.

## Proyectos

- el service transforma el contrato `snake_case` del backend al modelo de interfaz
- el código de proyecto se maneja como texto alfanumérico, conserva mayúsculas y
  minúsculas y admite hasta 50 caracteres sin conversiones numéricas
- el formulario valida campos obligatorios, coordinador y montos no negativos
- en edicion solo se envian diferencias reales
- altas y bajas de investigadores y becarios se consolidan al guardar
- los cambios de coordinador actualizan las relaciones involucradas en el guardado
- un proyecto cerrado no admite edicion hasta que sea reabierto
- las altas vuelven al home y las ediciones al detalle con `successMessage`
- el formulario conserva un borrador local por usuario y proyecto, solicita
  confirmacion antes de recuperarlo y lo elimina al guardar o descartar

## Participaciones relevantes

- el service admite listas planas o envueltas en `data`
- el formulario valida investigador, evento, forma de participacion y fecha
- las ediciones sin diferencias no llaman al backend
- el historial y la auditoria se consumen desde el detalle

## Services, hooks y contratos

Los services concentran HTTP, conversion de datos y payloads tipados. Los hooks
encapsulan React Query e invalidan listas, detalles e historiales despues de cada
mutacion. No existen fallbacks mock ante errores: los fallos de permisos, sesion o
conectividad se propagan para mostrar feedback real y accionable.

`ProyectoPayload.codigoProyecto` y `ProyectoApiResponse.codigo_proyecto` utilizan
`string`. La validación compartida del código exige un valor no vacío, con máximo
50 caracteres y patrón `[A-Za-z0-9]+`; el formulario envía el valor recortado y
muestra el error junto al campo.

## Seguridad y permisos

Las acciones de alta, cierre, reapertura, edicion y baja se condicionan con las
capacidades del usuario, sin considerar la interfaz como unica barrera. Los errores
se normalizan mediante el helper compartido y no se reflejan estructuras desconocidas
del servidor. No se utiliza HTML inyectado, storage del navegador ni `fetch` directo.
