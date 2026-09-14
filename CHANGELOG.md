# Changelog

Este archivo registra los cambios funcionales y correcciones derivados del
testing del sistema GIDAS.

El formato se basa en Keep a Changelog y las versiones siguen versionado
semántico cuando se publica una entrega.

## [Sin publicar]

### Corregido

#### ISS-09: feedback visible durante acciones asincronas

- Button centraliza texto de progreso, icono animado, aria-busy y role=status.
- ConfirmDialog espera promesas, bloquea confirmar/cancelar y sus campos durante
  la operacion, conserva errores seguros y recupera los controles al terminar.
- Integrado en guardados de formularios, altas/ediciones de catalogos,
  eliminaciones y desvinculaciones, reaperturas, exportacion Excel, busqueda
  y reintentos de tipos de personal y candidatos de proyectos.
- UCT mantiene feedback durante todo el guardado consolidado de directivos.
  El cierre de proyectos utiliza la confirmacion comun y la reapertura por
  seleccion informa progreso y evita peticiones concurrentes.
- Documentados diez modulos y el contrato comun. Pruebas de regresion de los
  componentes reales para progreso, bloqueo inmediato, fallo y recuperacion.

Validacion: 85 tests frontend, typecheck, build de produccion y diff check.
Pruebas de navegador a cargo del usuario. Sin cambios de contrato backend.
Preservados cambios previos ajenos.

#### ISS-09: evitar validaciones de fechas duplicadas

- Corregidos 19 campos de fechas en 15 formularios de Recursos, Personal,
  Proyectos, Grupo, Memorias, Transferencia y Produccion.
- Field muestra el error una sola vez; Calendar/DatePicker conserva la ayuda
  de formato o rango. Eliminados los parrafos redundantes de fechas de Docencia.
- Documentadas las convenciones de validacion en los siete modulos afectados.
- Los estados de botones quedan para la siguiente etapa acordada.

Validaciones: 83 tests frontend, typecheck, build de produccion y diff check
correctos. Comprobacion de renderizado Field/Calendar: un solo mensaje y
role=alert en 20 campos con ayuda literal, incluidos los 19 corregidos.
Pruebas de navegador a cargo del usuario; sin cambios de contrato backend.
Se preservan cambios previos ajenos.

#### ISS-08 e ISS-10 — Seguimiento de listado, validaciones y fecha de fin

- Investigador invalida Personal y candidatos de proyectos después de guardar;
  el listado combinado muestra primero las altas recientes entre todos los subtipos.
- Los tres formularios de Personal muestran Guardando con icono animado,
  deshabilitan el envío mientras esperan y recuperan el botón ante errores.
- Personal y Proyectos muestran avisos generales y enfocan el primer campo
  inválido, tanto para validaciones locales como para errores del servidor.
- Se permite el alta completa de proyectos históricos con fecha de fin pasada
  o de hoy, incluyendo coordinador e integrantes; las participaciones iniciales
  conservan el período del proyecto. Las fechas futuras se admiten en alta.
  Los proyectos previamente cerrados siguen requiriendo reapertura para editar.
- Se valida localmente el orden inicio-fin. Documentación de ambos módulos y
  seguimientos integrados en sus archivos de tareas, sin archivos temporales ni logs.

Validaciones: 46 tests backend, 83 frontend, typecheck y build de producción
correctos; git diff --check correcto. Se probaron formularios y React Query real
con caché vigente, errores, foco y prevención de doble envío. Pruebas de navegador
y PostgreSQL a cargo del usuario. Persisten warnings ajenos de Query.get y
ciclos SQLite; se preservaron cambios previos. Sin commits ejecutados.

Incidencia de entorno: un intento de build fue rechazado por acceso de esbuild
al directorio padre; la repetición del comando habitual terminó correctamente,
sin cambiar permisos ni configuración.

#### ISS-10 — Habilitar la asignación del coordinador de un proyecto

- Guardado de campos, coordinador e integrantes en una sola transacción POST/PUT,
  con rollback completo y bloqueo del agregado durante cambios en PostgreSQL.
- Elegibilidad de investigadores activos sin baja lógica; IDs inválidos,
  duplicados y coordinadores externos al proyecto se rechazan con errores por campo.
- Reemplazo del coordinador sin reconstruir participaciones ni alterar fechas;
  conservación visible de asignaciones inactivas y desvinculación con soft delete.
- Formulario con carga, error/reintento, vacío e instrucciones; IDs temporales
  rechazados antes de guardar, payload parcial y ausencia de peticiones sin cambios.
- Auditoría de coordinador y eventos relacionales dentro del guardado, contratos
  documentados y snapshots de memorias preservados.

Validaciones: 42 tests backend, 82 frontend, typecheck, build de producción y
git diff --check correctos. Pruebas de navegador a cargo del usuario. PostgreSQL
y concurrencia pendientes en Docker; SQLite no verifica FOR UPDATE. Warnings
preexistentes de Query.get y ciclos de claves foráneas SQLite; launcher del venv
con ruta antigua, se utilizó Python instalado con sus paquetes. Script y logs
temporales eliminados. Cambios previos preservados; tasks continúa ignorado.
Sin commits ejecutados.

### Documentado

#### ISS-05 a ISS-16 — Normalizar documentos de tareas pendientes

- Se normalizó `ISS-05.md` con el frontmatter utilizado por las tareas del
  proyecto; su definición y resolución funcional se registran en la entrada
  específica de ISS-05.
- Se dividió el documento agregado de ISS-06 a ISS-16 en once archivos
  independientes, cada uno con metadata, alcance, criterios de aceptación,
  pruebas mínimas y mensaje de commit sugerido.
- ISS-06 a ISS-16 permanecen pendientes; esta reorganización no representa su
  implementación funcional.

Validaciones:

- presencia de un archivo independiente por cada issue entre ISS-06 e ISS-16;
- verificación de identificadores, secciones y listas de tareas por documento;
- codificación UTF-8 y ausencia del archivo agregado original;
- `git diff --check`: correcto.

### Corregido

#### ISS-09 — Implementar mensajes de error accionables (pendiente prueba manual)

- Se conserva el contrato existente de errores y se normalizan mensajes públicos,
  campos inválidos y códigos HTTP de dominio/autenticación.
- Los errores inesperados incluyen una referencia correlacionable con los logs,
  sin reflejar SQL, trazas ni información de conexión.
- Los formularios muestran los errores del servidor junto al control y enfocan
  el primer campo inválido; los campos desconocidos conservan el aviso general.
- Se mantiene la regla alfanumérica del código de proyecto y las validaciones
  existentes. No se incorpora validación en tiempo real.
- Se actualizan los README transversales y de los módulos afectados.

Validaciones: 81 pruebas frontend, typecheck, build de producción y comprobación
de whitespace correctos. 89 pruebas backend de errores, proyectos, autenticación,
cookies, refresh no concurrente, permisos, personal, grupo, recursos, producción,
transferencia, catálogos y logs. Pendiente comprobación manual en navegador.
La prueba concurrente de refresh presenta una incidencia previa de limpieza
SQLite en Windows, ajena a ISS-09; no se declara validada la suite backend completa.
Los cambios se separan en commits por módulo a petición del usuario.
No se crearon herramientas auxiliares en esta continuación.

#### ISS-08 (seguimiento) — Validar horas semanales y usar tipos reales del catálogo

- Horas enteras de 1 a 168 en alta/edición de Personal, Becario e Investigador,
  con validación compartida de dominio frontend/backend y error de campo 400.
- Se unificaron PTAA/Profesional bajo clase Personal; el tipo se selecciona desde
  IDs/nombres reales del catálogo activo, sin filtrar ni asumir "Profesional".
  Se conservan clases especializadas de Becario/Investigador y rutas existentes.
- Catálogo con refresh al montar, feedback de carga/error/vacío y reintento;
  tipos anteriores no disponibles visibles pero deshabilitados en edición.
- Pruebas: 76 frontend (incluido formulario real con catálogo arbitrario y límites),
  31 backend de Personal/auditoría/permisos; TypeScript y build producción correctos.
- Manual Docker pendiente del usuario. No se alteran datos existentes ni historial;
  se exige corregir horas inválidas en el formulario antes de guardar. Advertencias
  ajenas SQLite/launcher venv ya documentadas. Se preservaron textos nuevos del
  calendario y se adecuaron sus tests sin cambiar esos textos.

#### ISS-08 (seguimiento) — Feedback de fechas y renovación de sesión

- Calendar muestra errores de formato y rango, resalta y asocia accesiblemente
  el mensaje al campo; conserva la fecha confirmada al rechazar el valor.
- La renovación mantiene la sesión ante fallos de red, errores HTTP distintos
  de 401 y respuestas malformadas; ofrece diálogo con reintento. Mantiene el
  vencimiento definitivo y la invalidación por 401, sin eludir permisos backend.
- Se documentaron los comportamientos en frontend Personal, auth y módulos.
- Validaciones: 73 tests frontend, TypeScript, build producción y 17 tests backend
  correctos. Test concurrente adicional falla en limpieza SQLite por WinError 32;
  advertencia ajena de ciclos SQLite y launcher venv antiguo sin modificar.
- Prueba visual/Docker pendiente del usuario; no se confirmó el status HTTP del
  deslogueo original. La corrección cubre el fallo temporal identificado en código.

#### ISS-08 — Corregir el alta de personal técnico administrativo y de apoyo

- Se corrigió la ruta del alta: `POST /api/v1/personal` sin barra final;
  la ruta anterior devolvía 404 antes de llegar al service.
- Se protegieron inserción, flush e historial de horas con rollback completo.
- Referencias a tipo y grupo deben existir y estar activas; errores 400
  incluyen campos para feedback local. Las horas requieren enteros positivos.
- El formulario conserva datos ante fallos, muestra errores por campo y mueve
  el foco; PTAA y Profesional usan el rol persistido `personal` en edición.
- La búsqueda enlaza al detalle de personal con la ruta completa.
- Se documentaron los contratos en frontend y backend y se agregaron pruebas.

Validaciones: 28 pruebas backend del bloque Personal y 69 frontend correctas;
TypeScript y build de producción correctos. Las integraciones de alta,
consultas y rollback se ejecutaron sobre SQLite aislado.

Limitaciones: prueba manual y validación contra PostgreSQL pendientes del
usuario, quien levantará Docker. `agent-browser` no está disponible. SQLite
advierte ciclos de claves foráneas al limpiar tablas globales, sin fallos.
ISS-09 conserva pendiente su alcance transversal. No se ejecutó commit.

#### Rango institucional de fechas — Validar ítems desde 2010

- Se centralizó `2010-01-01` como límite inferior de las fechas vinculadas con
  la actividad del grupo en frontend y backend.
- El calendario reutilizable aplica el rango por defecto en Grupo, Personal,
  Producción, Proyectos, Recursos, Transferencia y Memorias; los filtros de
  búsqueda quedan excluidos porque no crean ni modifican ítems.
- Los services rechazan payloads anteriores al rango institucional y conservan
  las reglas particulares sobre fechas futuras y orden de períodos.
- El equipo directivo impide además inicios o finalizaciones futuras y exige que
  la finalización no preceda al inicio.
- Se documentó el contrato transversal y su aplicación en cada módulo afectado.

Validaciones:

- frontend: typecheck correcto y 66 de 66 pruebas correctas en el host;
- build productivo frontend dentro de Docker: correcto, con 2659 módulos;
- backend focalizado dentro de Docker: 11 de 11 pruebas correctas;
- compilación de módulos y tests backend dentro de Docker: correcta;
- regresión backend dentro de Docker: 352 pruebas correctas y 3 incidencias
  ajenas por archivos de infraestructura del repositorio no montados en `/app`;
- la suite frontend no inicia dentro de su contenedor porque la versión de Node
  de esa imagen no admite `--experimental-strip-types`; la misma suite pasa en
  el host;
- la validación manual de pantallas queda reservada para el usuario.

#### ISS-06 — Evitar el cierre intempestivo de la sesión

- El backend informa la expiración del access token, la sesión renovable y el
  umbral configurable de advertencia sin exponer el refresh token fuera de su
  cookie `HttpOnly`.
- El frontend comparte una única renovación concurrente, reintenta cada solicitud
  original una sola vez y renueva por actividad únicamente cuando el access token
  está próximo a vencer.
- Se agregó un aviso accesible con acciones para continuar o cerrar la sesión, y
  el vencimiento conserva una ruta interna completa para restaurarla tras el login.
- Proyectos y configuración de UCT conservan borradores versionados por usuario,
  módulo y registro, con recuperación confirmada, descarte explícito y limpieza al
  guardar. Las claves sensibles se excluyen antes de persistir.
- El guardado pendiente del borrador se fuerza al abandonar o desmontar el
  formulario, evitando perder los últimos campos ingresados dentro del debounce.
- La recuperación se presenta como un diálogo modal obligatorio que inhabilita el
  resto de la pantalla hasta recuperar o descartar el borrador existente.
- Se documentaron `JWT_EXPIRATION_MINUTES`,
  `REFRESH_TOKEN_EXPIRATION_MINUTES` y `SESSION_WARNING_SECONDS` junto con el nuevo
  contrato de temporización.

Validaciones:

- frontend: 65 de 65 pruebas correctas;
- build productivo frontend: correcto, con 2659 módulos procesados;
- typecheck frontend: correcto;
- backend focalizado de autenticación ejecutado dentro de Docker: 27 de 27 pruebas
  correctas, incluida la renovación concurrente;
- `git diff --check`: correcto;
- stack Docker de desarrollo saludable para frontend, backend, PostgreSQL y Redis;
- la validación manual de comportamiento y pantallas queda reservada para la
  revisión del usuario al finalizar el flujo de tareas.

#### ISS-05 — Permitir códigos de proyecto alfanuméricos

- `codigo_proyecto` ahora se persiste y expone como texto alfanumérico de hasta 50
  caracteres, tanto en proyectos como en los snapshots de proyectos y
  distinciones utilizados por memorias.
- El alta y la edición comparten la misma validación backend, conservan el código
  real y devuelven errores accionables asociados al campo.
- El formulario dejó de convertir el código con `Number(...)`, valida el contrato
  antes de guardar y mantiene feedback accesible junto al input.
- Se agregó una migración Alembic para convertir las tres columnas involucradas y
  pruebas de contrato, snapshots, migración y validación frontend.

Validaciones:

- backend focalizado: 29 de 29 pruebas correctas;
- frontend: 56 de 56 pruebas correctas;
- build productivo frontend: correcto;
- API con SQLite: alta, edición, listado y snapshot conservan códigos
  alfanuméricos;
- Alembic: una única cabeza activa, `c6e8a1f4b2d9`;
- migración y reversión verificadas en SQLite; DDL PostgreSQL validado offline;
- `git diff --check`: correcto;
- no se ejecutó integración PostgreSQL ni prueba manual en navegador porque el
  stack Docker no estaba activo;
- el typecheck conserva una incidencia preexistente ajena en `CatalogosHome.tsx`
  por la diferencia entre `Histórico` y `Historico`.

#### ISS-04 — Clarificar permisos de sesión y unificar el rol lector

- Se unificó `LECTURA` como identificador canónico del rol lector en base de
  datos, API y frontend, y se actualizaron los datos iniciales generales y de
  testing para no volver a crear el alias `LECTOR`.
- Se agregó una migración reversible que renombra el rol heredado o, si ambos
  nombres existen, reasigna sus usuarios y elimina el duplicado sin dejar
  referencias huérfanas.
- `Mi perfil` ahora muestra una tarjeta transversal con el rol de la sesión, las
  acciones permitidas y sus restricciones. Para `LECTURA` se aclara que puede
  consultar información, pero no agregar, modificar ni eliminar registros.
- Se verificó y documentó que el borrado de equipamiento está habilitado para
  `ADMIN` y `GESTOR`, devuelve `403 FORBIDDEN` para roles de lectura y mantiene
  el soft delete con su trazabilidad.

Validaciones:

- frontend: 49 de 49 pruebas correctas;
- backend focalizado: 19 de 19 pruebas correctas, incluida la normalización de
  roles, los permisos del endpoint y el soft delete de equipamiento;
- build productivo frontend: correcto, con 2650 módulos procesados;
- Alembic: una única cabeza activa, `d7e4a2c9f1b6`;
- suite backend completa: 345 de 346 pruebas correctas; el único error corresponde
  al bloqueo conocido de un archivo temporal SQLite en Windows en la prueba de
  refresh concurrente;
- `git diff --check`: correcto;
- prueba manual y ejecución de la migración contra PostgreSQL no realizadas
  porque Docker no tenía servicios activos;
- el typecheck mantiene una incidencia preexistente en `CatalogosHome.tsx` por la
  diferencia entre los literales `Histórico` y `Historico`.

#### ISSUE-02 — Validar el rango de fecha de incorporación de equipamiento

- Se definió como rango válido desde el `01/01/2010` hasta la fecha actual,
  inclusive.
- Se incorporó la misma validación en el formulario y en el servicio backend para
  altas y ediciones, con límites visibles y mensajes accionables.
- Se documentó el contrato del módulo Recursos y se agregaron pruebas para los
  límites, fechas inexistentes y valores fuera de rango.

Validaciones:

- frontend: 40 de 40 pruebas correctas al cerrar ISSUE-02;
- backend focalizado de Recursos: 17 de 17 pruebas correctas;
- build productivo frontend: correcto;
- suite backend completa: 330 de 331 pruebas correctas; el único error corresponde
  al bloqueo conocido de un archivo temporal SQLite en Windows;
- prueba manual no ejecutada porque Docker no tenía servicios activos.

#### ISS-03 — Corregir desfases de fechas civiles y auditoría UTC

- Se separó el tratamiento de fechas civiles `YYYY-MM-DD` del tratamiento de
  timestamps para impedir corrimientos de día por zona horaria.
- Los timestamps de auditoría se serializan como UTC explícito y se muestran en la
  zona local del navegador, manteniendo compatibilidad con respuestas heredadas.
- Se centralizaron los helpers de fechas y se actualizaron formularios, detalles,
  historiales y filtros anuales de los módulos afectados.
- Se documentó el contrato temporal compartido en frontend y backend.

Validaciones:

- frontend: 45 de 45 pruebas correctas;
- caso Argentina UTC-3: `2026-01-01` conserva el día y
  `2026-09-07T02:13:31Z` se interpreta como `06/09/2026 23:13`;
- backend focalizado: 20 de 20 pruebas correctas;
- build productivo frontend: correcto;
- suite backend completa: 336 de 337 pruebas correctas; el único error corresponde
  al bloqueo conocido de un archivo temporal SQLite en Windows;
- `git diff --check`: correcto;
- prueba manual no ejecutada porque Docker no tenía servicios activos;
- el typecheck mantiene una incidencia preexistente en `CatalogosHome.tsx` por la
  diferencia entre los literales `Histórico` y `Historico`.

- Se corrigieron la ortografía, las tildes y la puntuación de etiquetas, títulos,
  ayudas, placeholders, confirmaciones y mensajes visibles de la interfaz en
  todos los módulos relevados.
