# Recursos

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

Equipamiento, erogaciones, becas y vinculaciones institucionales admiten fechas
desde el 01/01/2010. Se mantienen las reglas particulares que impiden fechas
futuras en incorporaciones y erogaciones.

## Funcionalidad

El modulo administra equipamiento e infraestructura y el resumen de ingresos y
egresos. Cada entidad dispone de home, formulario, detalle, auditoria e historial.
Los homes muestran hasta 9 elementos y los historiales 3 items por pagina.

## Servicios y contratos

Los services normalizan contratos planos y respuestas envueltas en `{ data }` sin
usar `any`. Equipamiento, erogaciones, payloads, catalogos e historiales mantienen
tipos explicitos. Las llamadas HTTP se concentran en services dedicados.

## Formularios y navegacion

- Las altas vuelven al home con `successMessage`.
- Las ediciones vuelven al detalle y envian solo diferencias reales.
- Equipamiento valida denominacion, descripcion, monto positivo finito y una fecha
  de incorporacion entre el `01/01/2010` y la fecha actual, ambos limites
  inclusive. El formulario informa el rango y lo aplica al selector de fecha; la
  funcion pura `utils/equipamientoValidation.ts` conserva la misma regla para el
  envio.
- Erogaciones valida numero entero positivo, catalogos, fecha e importes finitos no
  negativos; ingresos y egresos no pueden ser ambos cero.
- En edicion de erogaciones solo se envian ingresos y egresos, conforme al backend.

## Seguridad, permisos y errores

Los errores se procesan con `getErrorMessage`, admitiendo el contrato tipado del
backend sin reflejar cuerpos desconocidos. Las operaciones fallidas muestran un
fallback accionable. Los permisos visuales complementan los controles del backend.

El modulo no usa `any`, HTML no confiable, storage, secretos ni `fetch` directo.
React renderiza los datos como texto y los payloads se construyen con campos
permitidos explicitamente.

## Validacion tecnica

El cierre del modulo requiere auditoria estatica focalizada, pruebas unitarias
compartidas, `npm run typecheck` y `npm run build`.

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

## Indicadores de campos obligatorios (ISS-21)

Equipamiento y erogaciones muestran el indicador en cada campo que el formulario exige para guardar, incluidos ingresos y egresos de erogaciones.
