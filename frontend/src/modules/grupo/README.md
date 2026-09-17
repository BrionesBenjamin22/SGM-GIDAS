# Modulo frontend de grupo

El formulario UCT valida nombre/sigla y exige solo letras Unicode y espacios
en nombres de directivos al crear o preparar una edición. Esta validación no
consulta nuevamente el equipo.

El formulario UCT crea y asigna cada directivo mediante una sola solicitud transaccional. Al editar campos no vuelve a solicitar los directivos; los hooks del formulario tampoco fuerzan una recarga al guardar. Un acceso posterior al formulario consulta el estado actualizado.

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

Visitas y mandatos directivos admiten fechas desde el 01/01/2010. Las fechas de
inicio y finalización de directivos tampoco pueden ser futuras, y una
finalización no puede preceder al inicio del mandato.

## Vistas

El modulo contiene configuracion de UCT, directivos, programas,
planificaciones y visitas. Sus homes usan hasta 9 elementos por pagina y sus
detalles consumen auditoria e historial cuando existe endpoint.

## Planificaciones

- el home solicita `page` y `per_page=9` al backend
- el formulario envia solo diferencias reales en edicion
- el detalle muestra datos, auditoria, historial paginado de 3 elementos,
  `Volver` y `Editar` segun estado y permisos
- alta vuelve al home; edicion vuelve al detalle con `successMessage`
- los errores de carga, guardado y eliminacion usan mensajes seguros y visibles

## UCT y exportacion

- el contrato de la UCT se transforma desde los nombres del backend en el service
- las actualizaciones envian solo campos modificados
- las altas, cambios y finalizaciones de directivos se consolidan antes de guardar
- la configuracion institucional y las operaciones pendientes del equipo directivo
  se conservan en un borrador local por usuario y UCT hasta guardar o descartar
- la exportacion valida que la respuesta no este vacia y que su tipo sea compatible
  con Excel; los errores del servidor se normalizan antes de mostrarse

## Visitas academicas

- el service admite listas planas o envueltas en `data` y expone tipos dedicados
- el formulario valida razon, fecha, procedencia y tipo de visita
- en edicion solo se envian diferencias reales; si no existen, no se llama al backend
- el alta vuelve al home y la edicion al detalle con `successMessage`
- el detalle consume auditoria e historial con paginas de 3 elementos

## Directivos

Las altas faltantes, cambios de nombre y finalizaciones se preparan en el
formulario de UCT. Editar una fila no persiste inmediatamente: el usuario debe
guardar la UCT para aplicar los cambios pendientes. La pantalla informa cuando
existen operaciones sin guardar.

El equipo activo admite un unico `Director` y un unico `Vicedirector`. La home y
el formulario comparten la misma normalizacion de cargos; si uno ya existe, el
formulario ofrece solamente el cargo faltante. El backend vuelve a validar el
cupo y rechaza cargos distintos de los dos cargos institucionales.

El formulario consulta el equipo actual mediante `useDirectivos`, sin depender
de relaciones historicas incluidas en la UCT. Al guardar correctamente vuelve a
`/inicio` con `successMessage`, tanto para cambios institucionales como para
operaciones consolidadas del equipo directivo.

## Services, hooks y tipos

- los services centralizan HTTP y contratos TypeScript
- los hooks encapsulan React Query e invalidacion por dominio
- las pages conservan estado local y validaciones de formulario
- no deben existir llamadas `fetch` o `axios` directas fuera de services

## Permisos y errores

Los botones se condicionan con las capacidades del usuario y el estado activo
de la entidad. Los errores de carga, guardado, eliminacion y exportacion usan el
normalizador compartido y mensajes accionables; no se reflejan estructuras
desconocidas del servidor ni se utilizan alertas del navegador.

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
UCT mantiene isSubmitting durante todo el guardado consolidado, incluyendo
altas, modificaciones y finalizaciones pendientes de directivos.

## Opciones de UCT para memorias (ISS-16)

`gruposUtnServices.ts` consulta `GET /grupo-utn/opciones` y expone únicamente
`id` y `nombre` de las UCT activas. Memorias usa este contrato para el selector
de alta y para asociar explícitamente memorias anteriores sin UCT. La lectura
está disponible para ADMIN, GESTOR y LECTURA; el permiso de crear o corregir la
memoria se valida por separado en el módulo Memorias.

## Indicadores de campos obligatorios (ISS-21)

UCT, planificaciones y visitantes muestran el indicador en sus campos obligatorios; los datos de directivos lo muestran al habilitar su alta y la fecha de finalizacion al cerrar un cargo.

## Errores de Visitas (ISS-19)

VisitantesForm aplica error.details.fields mediante applyFieldErrors. Las claves razon, procedencia, fecha y tipo_visita_id se muestran junto a sus controles; una clave desconocida conserva el aviso general. Alta y edición presentan una indicación para revisar datos y reintentar.

UCT y planificaciones muestran los campos identificados por el backend sin interpretar el texto de los mensajes. `nombre_unidad_academica` y `objetivo_desarrollo` se vinculan a facultad regional y objetivos; una planificación duplicada identifica `anio`. Las fallas de las operaciones de directivos permanecen como aviso general cuando no puede asociarse de forma inequívoca a uno de los dos controles visibles.
