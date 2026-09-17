# Memorias

## Errores por campo (ISS-09)

Los formularios del módulo consumen `error.details.fields` mediante
`applyFieldErrors` de `src/lib/httpError.ts`, muestran el mensaje junto al control
y enfocan el primer campo inválido. Los nombres locales de los controles se
vinculan con las claves API, sin cambiar el payload del service ni los permisos.
Los errores sin campo o con campos desconocidos conservan el aviso general;
los errores inesperados muestran un mensaje publico seguro o un fallback accionable, sin identificadores internos.
Se conservan las reglas y el momento de validación existentes. Véase el contrato
transversal en `../README.md`.

## Fechas

Los períodos informados por las memorias admiten fechas desde el 01/01/2010, conservan el orden cronológico y pueden abarcar años distintos.

## Funcionalidad

El modulo administra memorias, sus versiones, cambios de estado, reaperturas,
snapshots historicos y exportacion Excel. El home pagina hasta 9 elementos y el
alta vuelve al home con `successMessage`.

## Vistas y permisos

- `MemoriasHome`: listado y filtros; ADMIN y GESTOR pueden crear memorias y la
  baja lógica continúa reservada a ADMIN. El botón `Seleccionar` inicia la baja
  múltiple, por eso solo se muestra a ADMIN; cada tarjeta abre el detalle.
- `MemoriaForm`: alta con validacion de periodos.
- `MemoriaDetalle`: auditoria, versiones y cambios de estado. ADMIN y GESTOR
  pueden enviar a revisión y cerrar; el cierre se presenta como acción explícita.
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

## Validaciones de fechas sin duplicados (ISS-09)

Los errores del formulario se muestran una sola vez mediante Field. El
helperText de Calendar/DatePicker contiene exclusivamente ayuda de formato o
rango; no recibe el mensaje de error del formulario. Se conservan los límites,
las reglas de validación y el foco del primer campo inválido.

## Feedback de acciones (seguimiento ISS-09)

Las acciones asíncronas del módulo usan Button con loading/loadingText
o ConfirmDialog, que espera la promesa devuelta por onConfirm. Durante la
operación se muestra texto de progreso con un icono animado, aria-busy y
role=status. El botón de acción se deshabilita hasta terminar; las
confirmaciones bloquean además cancelar, el fondo y los campos del diálogo.
El estado se libera al resolver o fallar, conservando errores y mensajes de
éxito existentes. Los callbacks basados en React Query deben devolver
mutateAsync para que el diálogo cubra toda la operación.

## ISS-12: autoría de integrantes

Los snapshots de trabajos reciben autores congelados (id, rol, nombre_apellido, tipo, activo), y el Excel de la versión incluye investigadores y becarios. La navegación hacia homes y detalles mantiene el contexto de memoria y el contrato de las secciones.

Corrección de alcance ISS-12: los autores de trabajos son únicamente investigadores y becarios. Personal (PTAA/profesional) no puede vincularse como autor. Se mantiene la etiqueta Autores.

## ISS-13: fecha de presentación de trabajos

Los snapshots de trabajos en reuniones exponen fecha_presentacion y sus enlaces
apuntan al flujo de reuniones con esa fecha. Excel identifica Fecha de
presentación y clasifica ponencias según el rango configurado de la memoria.
Se conserva contexto de navegación y el resto del contrato de snapshots.

## ISS-14: enlaces de trabajos en snapshots

El contrato de entradas de snapshot admite `enlace` string o null para ambos
tipos de trabajo mediante MemoriaSnapshotEntry. La descarga Excel incluye el
valor congelado. La vista conserva contadores y navegación vigente hacia los
registros del módulo; esos destinos muestran los datos actuales del trabajo.
La revisión de pertenencia y presentación histórica permanece planificada en
ISS-16, sin implementación dentro de ISS-14.

## ISS-16: períodos configurables por UCT

ADMIN y GESTOR crean memorias seleccionando UCT, inicio y fin, incluso entre años, con un atajo para año calendario. El detalle permite corregir solo diferencias reales antes del primer cierre, vuelve con `successMessage` y muestra cambios de período, estado y reapertura paginados de 3 ítems. Home, detalle y Excel identifican la memoria por rango y UCT.

El período delimita el contenido pero no cierra automáticamente la memoria.
ADMIN y GESTOR pueden pasarla a revisión o cerrarla desde el detalle; reabrir y
eliminar continúan reservados a ADMIN. El historial rotula la relación como UCT
y muestra su sigla en lugar del identificador técnico.

La ruta de alta usa la misma protección `ADMIN/GESTOR` que el botón `Nueva`, para
evitar que un gestor autorizado sea redirigido al inicio al abrir el formulario.

Las versiones conservan el flujo visual anterior: cada sección informa su cantidad
y abre el módulo correspondiente filtrado por los elementos incluidos en la
memoria. Los snapshots históricos siguen respaldando el alcance y el Excel, sin
desplegables adicionales dentro de las tarjetas. La planificación actual se
presenta como una acción separada y no modifica los datos congelados ni el Excel
de la versión.

## Indicadores de campos obligatorios (ISS-21)

El alta y la correccion de periodos muestran el indicador en UCT e inicio y fin del periodo. La fecha de apertura sigue siendo opcional.

## ISS-19: errores de formularios

El alta y la corrección del período muestran `details.fields` junto a UCT e inicio/fin del período. El alta también asocia errores de `fecha_apertura` con su control opcional. Se conserva el borrador y se impide un segundo envío durante el guardado. Los errores sin campo identificable permanecen en el aviso general.
