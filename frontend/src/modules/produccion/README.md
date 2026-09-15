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
- Trabajos en reuniones y revistas mantienen integrantes autores (ISS-12).
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

## ISS-11: feedback del selector de investigadores en trabajos (2026-09-13)

Los formularios de reuniones y revistas distinguen carga inicial, lista vacia y
error de consulta con Reintentar y progreso accesible. El guardado y el selector
se bloquean mientras no existe una respuesta disponible; una actualizacion en
segundo plano con cache conserva opciones y acciones. Las selecciones no se
reinician por fallos o reintentos. No cambian el endpoint, permisos ni payloads.
El componente InvestigadoresQueryFeedback es exclusivo de produccion.

La inspeccion previa del endpoint real devolvio HTTP 200 con dos investigadores
activos; el incidente original de opciones ausentes no se reprodujo. La ampliacion
de autoria queda en ISS-12, independiente de esta mejora.

Validacion: 88 tests frontend (incluidas regresiones de carga, error, reintento y
conservacion de selecciones), typecheck y build:production correctos. La prueba
visual y los guardados en navegador quedan a cargo del usuario.

Validacion backend: 28 tests correctos de historial de trabajos en reuniones/revistas y errores de dominio de produccion (unittest).

## ISS-12: integrantes autores

Las vistas de alta/edición, detalle y home de trabajos en reuniones y revistas
consumen `autores`. Un autor tiene `id`, `rol` (`investigador` o `becario`),
`nombre_apellido`, `tipo` y `activo`. El par `(rol, id)` identifica
al integrante; no se mezclan personas con IDs iguales de categorías distintas.
Se muestran nombres y categorías; no se registran autores externos.

`trabajoAutoresServices.ts` define los contratos, etiquetas, claves y comparación
de colecciones. `useIntegrantesAutores` consulta integrantes activos mediante
`GET /personal-all?activos=true` (normalizado a `/api/v1/personal/all`). El service
filtra ese listado combinado y ofrece únicamente investigadores y becarios;
Personal (PTAA/profesional) queda excluido. La etiqueta visible sigue siendo Autores.

La regla `esAutorSeleccionable` se aplica en el service y en el selector para
excluir categorías no habilitadas e inactivos incluso frente a opciones antiguas.
La caché usa `integrantes-autores / investigadores-becarios`, separada del
listado anterior. Los autores históricos inactivos permanecen en la selección
existente y pueden quitarse, pero no aparecen como nuevas opciones.
Desde los detalles de congresos y revistas, Editar abre el formulario común de
autores de ese trabajo; ambos permiten agregar investigadores y becarios.
En Docker de desarrollo, si Vite conserva módulos anteriores tras editar
archivos del volumen, reiniciar el servicio frontend y comprobar los módulos
servidos por HTTP antes de dar el ajuste por aplicado al entorno.
`IntegrantesAutoresField` permite selección múltiple sin duplicados y bajas
locales. Los autores históricos inactivos siguen visibles y se pueden quitar.
`AutoresQueryFeedback` reemplaza el feedback exclusivo de investigadores:
conserva carga/error/vacío/reintento y mantiene selecciones frente a refetch.

Los services de trabajos envían `autores: [{rol, id}]` junto a los campos del
trabajo en POST/PUT, en una única operación. En edición solo se envía la colección
si cambió realmente, sin considerar cambios de orden; las altas y bajas se
consolidan al pulsar Actualizar. Si no hay cambios no se llama al backend.
Un refetch no sobrescribe el borrador. El formulario requiere al menos un autor,
la UCT configurada y los permisos de alta/edición del usuario. Los detalles
solo habilitan Editar si el registro está activo y el rol lo permite.

Alta vuelve al home y edición al detalle con `successMessage`. El guardado
bloquea el selector, muestra progreso y conserva errores seguros/accionables.
Las fallas al cargar un registro ofrecen reintento; una lista cacheada utilizable
mantiene las acciones habilitadas. Las búsquedas locales admiten nombres de
cualquier autor; el filtro de reuniones usa claves compuestas y categorías.
Homes conservan 9 items y el historial 3 items por página.

Los detalles muestran nombres y tipos de autor y eventos de alta/baja dentro
del historial existente. La búsqueda global usa `extra.autores`. Los snapshots
de memoria reciben autores congelados y el Excel incluye todas las categorías.
El cambio de esquema requiere regenerar el dataset de testing; no hay adaptación
temporal del contrato exclusivo de investigadores.

Pruebas: `tests/trabajoAutores.test.ts` ejecuta selector y formularios reales
mediante SSR/harness de hooks para IDs coincidentes, conservación de inactivos,
altas/bajas locales, guardado único, navegación, refetch y edición sin cambios.
`tests/investigadoresFeedback.test.ts` conserva las regresiones de ISS-11,
actualizadas a integrantes autores. Validación técnica: npm test, typecheck
y build:production; validación del navegador contra backend temporal.

## ISS-12: buscador de autores con confirmación explícita

IntegrantesAutoresField, compartido por congresos y revistas, filtra localmente
por fragmentos de nombre/apellido o prefijo de iniciales, sin distinguir tildes
ni mayúsculas. Permite categoría Investigador/Becario, muestra nueve resultados
y amplía de nueve en nueve con Ver más. Cambiar búsqueda o categoría reinicia
el límite. El listado excluye seleccionados, personal e inactivos.
Cada resultado tiene Añadir; escribir, perder foco o pulsar Enter en el buscador
no añade ni envía el formulario. Autores seleccionados permite Quitar;
las relaciones se persisten únicamente al guardar el formulario. Los controles
se bloquean durante guardado según el formulario. Etiquetas asociadas, botones
con type=button y estado de resultados anunciado. Sin cambio de API: se reutiliza
la consulta cacheada de integrantes; la búsqueda y ampliación son locales,
no paginación de servidor. La validación visual queda a cargo del usuario.

## ISS-13: fecha de presentación

TrabajosReunionForm, Detalle y Home consumen fecha_presentacion. El formulario
usa Fecha de presentación, mantiene Calendar institucional y envía solo
diferencias; alta vuelve al home y edición al detalle con successMessage.
El service tipa la fecha nueva y admite fecha_inicio únicamente al normalizar
respuestas antiguas; no envía ese nombre anterior. Home filtra el año civil
y muestra la fecha de presentación. Detalle etiqueta la fecha y adapta
eventos históricos fecha_inicio/fecha_presentacion a Fecha de presentación
con valores formateados, conservando paginación de tres y permisos de edición.
No se modifica el flujo de revistas, cuya fecha ya tiene otro contrato.
No se modifican hooks compartidos ni componentes globales.

## ISS-14: enlace al trabajo o DOI

Formularios de congresos/reuniones y revistas ofrecen un input URL opcional,
con placeholder DOI y máximo 2048 caracteres. `utils/trabajoEnlace.ts` valida
HTTP/HTTPS y longitud al guardar; el backend valida de manera independiente.
El DOI debe ser una URL completa https://doi.org/… . Vaciar elimina el enlace
mediante null; edición envía solo diferencias y no solicita cambios si no hay.
Los errores API `enlace` se muestran en el campo. No se normalizan mayúsculas.
Services dedicados tipan `enlace?: string | null` y normalizan ausentes a null.

Detalle muestra la URL como enlace solo cuando pasa `enlaceSeguro`, con
target=_blank, rel=noopener noreferrer y aviso accesible de pestaña nueva.
Mantiene permisos, navegación e historial de tres items; home conserva nueve.
No hay consultas adicionales ni previsualización remota del destino.
Regresiones SSR/harness en trabajoAutores.test.ts verifican apertura segura,
validación, carga/edición, alta, eliminación y diferencias reales.

La validación también rechaza hosts inválidos; admite dominios internacionalizados
y hosts IPv6 válidos mediante los analizadores de URL de cada plataforma.
