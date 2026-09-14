# Produccion

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

Las fechas de publicaciones, reuniones, docencia, distinciones, documentación
y registros de propiedad admiten valores desde el 01/01/2010. Cada formulario
mantiene además sus restricciones vigentes sobre fechas futuras y períodos.

## Funcionalidad

El modulo administra actividades de docencia, articulos de divulgacion,
documentacion bibliografica, distinciones, registros de propiedad, trabajos en
reuniones cientificas y trabajos en revistas.

Cada entidad dispone de home, formulario y detalle. Los homes muestran hasta 9
elementos por pagina. Las altas vuelven al home con `successMessage`; las ediciones
vuelven al detalle.

## Servicios y contratos

Los services dedicados concentran las llamadas HTTP, los tipos de payload y la
normalizacion de respuestas. Las listas aceptan el contrato plano heredado y el
contrato `{ data }` sin recurrir a `any`. Los historiales aceptan ambos formatos y
devuelven arreglos tipados.

Los mensajes HTTP se procesan con `getErrorMessage`, compatible con errores tipados
del backend. Los cuerpos de texto o estructuras desconocidas no se reflejan en UI.

## Relaciones

- Documentacion mantiene autores asociados.
- Trabajos en reuniones y revistas mantienen investigadores asociados.
- Las altas y vinculaciones se consolidan al guardar el formulario.
- Las desvinculaciones requieren confirmacion y actualizan datos e historial.
- Una edicion sin diferencias reales no llama al endpoint de actualizacion.

## Permisos y seguridad

Las vistas consultan los permisos del usuario para habilitar altas, ediciones y
bajas. Estas restricciones visuales complementan los controles obligatorios del
backend y no se consideran una barrera de seguridad independiente.

Los inputs se recortan, validan y normalizan antes de construir el payload. React
renderiza los valores como texto y el modulo no utiliza HTML no confiable, `eval`,
almacenamiento de credenciales ni llamadas HTTP fuera de services.

## Auditoria e historial

Los detalles presentan datos principales, auditoria e historial de cambios mediante
`HistorialCambiosCard`, cuya paginacion predeterminada es de 3 items. Los eventos
relacionales de autores e investigadores se invalidan junto con el historial despues
de cada operacion.

## Errores y validacion

- Los formularios muestran validaciones junto al campo correspondiente.
- Los errores del servidor usan mensajes seguros y fallbacks accionables.
- Las eliminaciones y desvinculaciones requieren confirmacion y feedback visible.
- La validacion tecnica del modulo comprende pruebas unitarias compartidas,
  `npm run typecheck` y `npm run build`.

## Validaciones de fechas sin duplicados (ISS-09)

Los errores del formulario se muestran una sola vez mediante Field. El
helperText de Calendar/DatePicker contiene exclusivamente ayuda de formato o
rango; no recibe el mensaje de error del formulario. Se conservan los límites,
las reglas de validación y el foco del primer campo inválido.
Docencia tampoco renderiza párrafos manuales para repetir errores de fechas.

## Feedback de acciones (seguimiento ISS-09)

Las acciones asíncronas del módulo usan Button con loading/loadingText
o ConfirmDialog, que espera la promesa devuelta por onConfirm. Durante la
operación se muestra texto de progreso con un icono animado, aria-busy y
role=status. El botón de acción se deshabilita hasta terminar; las
confirmaciones bloquean además cancelar, el fondo y los campos del diálogo.
El estado se libera al resolver o fallar, conservando errores y mensajes de
éxito existentes. Los callbacks basados en React Query deben devolver
mutateAsync para que el diálogo cubra toda la operación.
