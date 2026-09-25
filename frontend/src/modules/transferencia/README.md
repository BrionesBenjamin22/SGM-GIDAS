# Transferencia frontend

El listado consulta `/transferencias/?activos=...` con la barra final exigida
por la ruta GET del backend. Así el proxy de desarrollo no recibe un 308 hacia
el nombre interno `backend`, inaccesible desde el navegador.

El alta inline de adoptantes exige solo letras Unicode y espacios. El
formulario de transferencia rechaza denominación y demandante exclusivamente
numéricos. Ambos conservan el texto para corregirlo.

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

Los períodos de transferencias socio-productivas admiten fechas desde el
01/01/2010 y la fecha de fin no puede ser anterior a la fecha de inicio.

## Alcance

El modulo administra transferencias socio-productivas, sus adoptantes y los tipos
de contrato. Incluye home, alta, edicion, detalle, auditoria e historial de cambios.

## Vistas y navegacion

- `TransferenciasHome` lista hasta 9 registros por pagina, filtra activos e inactivos
  y permite la baja logica segun los permisos del usuario.
- `TransferenciasForm` valida los datos, consolida altas y bajas de adoptantes y en
  edicion envia solo diferencias reales. Un alta vuelve al home y una edicion al
  detalle, siempre con `successMessage`.
- `TransferenciasDetalle` presenta datos, auditoria e historial. El componente de
  historial pagina 3 eventos y contempla cambios de campos y relaciones.

## Services y contratos

- `transferenciasServices.ts` adapta el contrato snake_case del backend al modelo
  TypeScript de la UI. Las relaciones usan `adoptantes_ids` en operaciones POST y
  DELETE sobre `/transferencias/:id/adoptantes`.
- `adoptantesServices.ts` consume el CRUD del backend, incluida la baja logica con
  `DELETE /adoptantes/:id`.
- `tiposContratoService.ts` obtiene el catalogo desde `/tipo-contrato/`.
- `useTransferencias.ts` y `useAdoptantes.ts` encapsulan consultas, mutaciones e
  invalidacion de cache.

Las respuestas de listas e historiales admiten tanto arreglos planos como envoltorios
`{ data }`, sin recurrir a `any`. Los errores se interpretan con el helper seguro
compartido y se muestran con mensajes accionables sin exponer detalles internos.

## Validaciones y relaciones

- Numero de transferencia entero y positivo.
- Denominacion y demandante con al menos 3 caracteres luego de recortar espacios.
- Descripcion con al menos 10 caracteres.
- Monto finito y mayor que cero.
- Fecha de inicio obligatoria y fecha final no anterior.
- Tipo de contrato y grupo UTN obligatorios.
- Las altas y bajas de adoptantes se calculan antes de guardar y no se persisten al
  seleccionar o quitar elementos del formulario.

## Permisos y seguridad

La UI respeta los permisos de creacion, edicion y eliminacion provistos por auth; el
backend sigue siendo la autoridad final y protege los endpoints por rol. Las bajas
son logicas y quedan auditadas. El detalle oculta la edicion de registros inactivos.

El mock de transferencia solo se habilita en desarrollo cuando
`VITE_ENABLE_TRANSFERENCIA_MOCK=true`. Sus datos viven en memoria de la pestaña;
nunca se guardan en `localStorage` ni se usan como fallback automatico por falta de
configuracion de API o en builds de produccion.

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

El formulario de transferencias indica los datos obligatorios; la fecha de fin permanece opcional.

ISS-19: las validaciones del backend se muestran junto a los controles mediante `applyFieldErrors`; alta y edición usan fallbacks propios. Los errores sin campo visible conservan el aviso general y los cambios de adoptantes permanecen consolidados hasta guardar.

El selector de adoptantes muestra los errores estructurados de `adoptantes_ids` junto a la selección.
El alta inline del adoptante muestra `error.details.fields.nombre` junto al nombre, conserva el valor para corregirlo, enfoca el control y deja el aviso general para errores sin campo conocido.

## Borradores de formularios (ISS-22)

En transferencias, los cambios no se guardan como borrador mientras se escribe.
Al pulsar Volver con cambios, el dialogo permite guardar el ultimo estado en
el servidor, descartarlo o seguir editando. La navegacion externa al formulario
queda sujeta a la misma confirmacion. La lista global muestra el tipo, un dato
identificable del borrador cuando esta disponible, y la fecha de guardado.
Al abrirlo se puede recuperar o descartar; un guardado exitoso elimina el
borrador. El contenido no se almacena en localStorage ni sessionStorage.

## Paginación de listados (ISS-23)

Los resultados paginados muestran controles centrados de anterior, números
de página y siguiente, inmediatamente debajo de las tarjetas o resultados.
El máximo de resultados por página conserva el contrato del módulo.
