# Changelog

Este archivo registra los cambios funcionales y correcciones derivados del
testing del sistema GIDAS.

El formato se basa en Keep a Changelog y las versiones siguen versionado
semántico cuando se publica una entrega.

## [Sin publicar]

### ISS-31: presentar relaciones legibles en el historial de Proyectos

- Home y detalle muestran vinculaciones y desvinculaciones de investigadores y
  becarios como acciones directas acompanadas por el nombre correspondiente, sin
  etiquetas de valor anterior/nuevo, IDs ni JSON.
- Las asignaciones de `coordinador_id` se presentan como `Coordinador asignado`
  seguido del nombre del investigador. Los cambios ordinarios conservan su
  comparacion anterior/nuevo.
- Se incorporo una opcion optativa en la tarjeta compartida de historial para que
  cada modulo presente eventos de accion sin modificar a los demas consumidores.

Validaciones: aceptacion funcional del usuario, prueba focalizada 2/2, 135
pruebas frontend, `typecheck`, build de produccion y `git diff --check` correctos.

### ISS-30: estandarizar Trabajos en reuniones con la grilla comun

- Trabajos en reuniones reemplazo las tarjetas, seleccion masiva y panel lateral
  por la tabla compartida con 9 filas, busqueda, filtros, navegacion y acciones
  por registro condicionadas por estado y permisos.
- La barra horizontal alinea chips y selectores y reutiliza el scrollbar compacto
  local del patron aprobado.
- El historial se carga al expandir, pagina de a 3 eventos y distingue carga,
  error recuperable y vacio. Omite acciones tecnicas, inicializaciones y valores
  equivalentes, y normaliza objetos para evitar representaciones invalidas.
- Las vinculaciones y desvinculaciones de autores muestran la accion, el nombre y
  la categoria directamente, sin pares de valor anterior/nuevo.
- Se agrego `frontend/CONVENCIONES_PANTALLAS.md` como contrato transversal para
  adaptar homes, formularios, detalles e historiales de los modulos restantes.

Validaciones: aceptacion visual y funcional del usuario, prueba focalizada 5/5,
135 pruebas frontend, `typecheck`, build de produccion, 46 pruebas backend
focalizadas y `git diff --check` correctos.

### ISS-28: estandarizar Registros de propiedad con la grilla comun

- Registros de propiedad reemplazo las tarjetas, la seleccion masiva y el panel
  lateral por la tabla compartida, con 9 filas por pagina, busqueda, chips de
  estado, filtros de tipo y fecha, navegacion y acciones por registro segun
  permisos y estado.
- La barra de filtros mantiene el espaciado y desplazamiento horizontal del
  patron de Proyectos cuando el ancho disponible no alcanza.
- Cada fila permite expandir un historial diferido de 3 eventos por pagina. Home
  y detalle omiten acciones, inicializaciones y valores sin cambios.
- Se verifico el contrato plano de `tipo_registro` y `grupo`; la presentacion
  defensiva de valores estructurados evita mostrar `[object Object]` en columnas,
  filtros, etiquetas e historial.
- El alta no genera cambios de inicializacion y una actualizacion sin diferencias
  no persiste auditoria. Se agregaron regresiones backend para ambas garantias.

Validaciones: aceptacion visual y funcional del usuario, 130 pruebas frontend,
`typecheck`, build de produccion, 6 pruebas backend de Registros de propiedad y
`git diff --check` correctos.

### ISS-27: estandarizar Actividades en Docencia con la grilla comun

- Actividades en Docencia reemplazo las tarjetas y la seleccion masiva por la
  tabla compartida de Personal y Proyectos, con 9 filas por pagina, busqueda,
  filtros, ordenamiento, navegacion desde la fila y acciones por registro segun
  permisos y estado.
- Rol y grado academico se normalizan desde el contrato `{ id, nombre }`; los
  filtros usan un desplazamiento horizontal compacto y mantienen los chips
  centrados.
- El historial diferido muestra 3 eventos por pagina y, al igual que la tarjeta
  del detalle, permanece informativo. El grado inicial ya no se presenta como un
  cambio y los cambios reales muestran los nombres anterior y nuevo.
- Editar y eliminar conservaron sus contratos. PUT y DELETE respondieron 200 en
  pruebas, y la eliminacion mantiene baja logica y confirmacion transaccional.

Validaciones: aceptacion visual del usuario, 125 pruebas frontend, `typecheck`,
build de produccion, 38 pruebas backend de Produccion/Docencia y
`git diff --check` correctos.

### ISS-26: reformular Proyectos con tabla e historial legible

- Proyectos reemplazó el listado anterior por la tabla compartida de 9 filas, con
  búsqueda, filtros, ordenamiento, acciones por registro e historial diferido de
  3 eventos por página. El formulario conserva la nomenclatura y el icono de
  remoción utilizados en Personal.
- El listado backend admite paginación, filtros y ordenamiento sin romper el
  contrato plano anterior. Edición y cierre bloquean exclusivamente la fila del
  proyecto, corrigiendo el error de PostgreSQL causado por `FOR UPDATE` sobre
  relaciones opcionales cargadas mediante `LEFT JOIN`.
- La composición inicial del personal ya no se registra como un cambio. Las
  vinculaciones y desvinculaciones posteriores conservan y muestran el nombre de
  la persona sin exponer JSON ni identificadores internos.
- El usuario validó manualmente la estructura visual, las acciones de edición,
  cierre y el historial sin vinculaciones iniciales. La comprobación visual final
  permaneció a cargo del usuario.

Validaciones: 31 pruebas backend de Proyectos, 119 pruebas frontend, `typecheck`,
build de producción, consulta real de bloqueo en PostgreSQL y `git diff --check`
correctos.

### ISS-25: reformular Personal con una tabla reutilizable

- Se incorporo `Table.tsx`, una tabla generica, controlada, responsive y
  accesible con toolbar, busqueda, chips, orden, expansion, estados uniformes y
  paginacion. Personal reemplazo las tarjetas por una tabla de 9 filas con
  navegacion desde la fila, acciones con iconos e historial diferido de 3 eventos.
- El listado canonico `GET /api/v1/personal/all` pagina, filtra, busca y ordena en
  base de datos. Sin parametros de paginacion conserva el contrato plano anterior;
  el contrato paginado devuelve filas normalizadas y metadata estandar.
- El alta muestra las tres clases de registro de forma visible y la edicion
  mantiene la clase informativa. Categoria UTN y Programa de Incentivos son
  opcionales, admiten eliminacion con `null` y registran los cambios en auditoria.
- Los formularios conservan el envio exclusivo de diferencias y ahora vuelven
  directamente desde edicion cuando no existen cambios reales; la confirmacion
  de borrador permanece para modificaciones pendientes.
- El usuario valido busqueda, filtros, paginacion suavizada, acciones, navegacion
  por fila, historial y salida de formularios sin cambios. El manual de usuario
  permanece fuera del alcance de esta etapa.

Validaciones: 32 pruebas backend de Personal, 117 pruebas frontend, `typecheck`,
build de produccion y `git diff --check` correctos. Se revisaron permisos,
estados accesibles, foco, responsive y reduccion de movimiento.

### ISS-01: simplificar la gestion de Catalogos

- Catalogos muestra un selector de tipo y una grilla compacta de valores; retiro
  filtros por grupo/etiqueta, contadores y advertencias repetidas.
- Cada fila consulta su historial al abrir la accion correspondiente y lo pagina
  de a 3; el listado conserva 9 valores por pagina y distingue Vigente/Inactivo.
- Altas y cambios de nombre exigen al menos una letra Unicode en frontend y en
  los servicios backend de los catalogos administrados. Se preservan IDs,
  referencias y registros anteriores; se actualizaron los README tecnicos.

Validaciones: 112 pruebas frontend, typecheck, build de produccion, 8 pruebas
backend focalizadas y suite backend completa de 457 pruebas con 1 incidencia
preexistente de limpieza SQLite en Windows (`test_doble_refresh_concurrente_solo_rota_una_vez`).
El usuario valido la interfaz y las acciones de crear, editar y eliminar Tipos de Personal.
El manual de usuario queda a cargo del usuario al finalizar todos los modulos.

### ISS-19: contextualizar errores de formularios y validar nombres de personas

- Los formularios de Auth, Grupo, Personal, Produccion, Proyectos, Recursos,
  Transferencia y Memorias muestran errores por campo mediante `details.fields`
  y mensajes generales accionables, sin clasificar campos por texto libre.
- Los nombres y apellidos de personas, directivos, autores y adoptantes aceptan
  letras Unicode y espacios; frontend y backend rechazan cifras y signos.
- Auth renueva credenciales tras cambiar la contrasena. La creacion y asignacion
  de directivos usa una transaccion; Erogaciones permite corregir fechas y
  editar otros campos con cambios parciales.
- Se corrigio la edicion de segmentos y separadores del calendario. El borrador
  de Erogaciones y la confirmacion de salida se consolidaron en ISS-22.

Validaciones: 114 pruebas frontend, `typecheck`, build de produccion y pruebas
backend focalizadas; el usuario confirmo los flujos manuales de nombres,
sesion, fechas, erogaciones y formularios. La prueba de rollback de directivos
paso en PostgreSQL. La suite backend completa se ejecuto en Docker; tres
pruebas de despliegue requieren archivos de la raiz que no se montan en el
contenedor y pasan desde el host.

### ISS-22: persistir borradores de formularios en backend

- Los formularios principales guardan un único borrador por usuario, módulo y
  registro en el servidor, con recuperación, descarte y confirmación al salir.
  La lista identifica los borradores y se actualiza al guardarlos o borrarlos.
- Se retiró el almacenamiento de borradores y adoptantes de `localStorage`.
  El backend limita tamaño y vigencia, rechaza claves sensibles y aísla los
  borradores por usuario y rol.
- El usuario validó los formularios y el listado, incluida Transferencias tras
  corregir su ruta en ISS-24.

Validaciones: 111 pruebas frontend, `typecheck`, build de producción, 7 pruebas
backend de borradores y prueba manual de los módulos. Los borradores vencidos
se eliminan al consultar o guardar; la limpieza periódica de usuarios inactivos
queda como límite operativo.

### ISS-23: unificar la paginación de los listados

- Los 18 listados paginados usan páginas numeradas centradas debajo de los
  resultados; Erogaciones y Planificaciones dejaron de ubicarla al borde inferior.

Validaciones: auditoría de los 18 listados, 111 pruebas frontend, `typecheck`,
build de producción y validación manual de los módulos.

### ISS-24: corregir Participaciones y la carga de Transferencias

- Participaciones presenta el nombre del evento con mayúsculas consistentes en
  home y detalle, sin alterar el valor guardado.
- Transferencias consulta la ruta GET con barra final y evita el 308 que enviaba
  al navegador al nombre interno de Docker. La prueba de contrato cubre la ruta.

Validaciones: 111 pruebas frontend, `typecheck`, build de producción y prueba
manual de Transferencias. El proxy respondió directamente desde backend sin
redirección al usar la ruta corregida.

### ISS-18: ocultar referencias internas en mensajes visibles de la interfaz

- Los errores visibles usan mensajes publicos seguros o un fallback accionable;
  ya no agregan `request_id` ni referencias de seguimiento. Se retiro la opcion
  que podia mostrar esas referencias y la exportacion sin consumidores.
- Se reforzaron las pruebas frente a SQL, identificadores malformados y cuerpos
  desconocidos, y se revisaron los consumidores y la documentacion de frontend.
- El usuario confirmo un POST 400 real de Proyectos: el ID aparecio en la
  cabecera y el log del backend, pero no en la UI. Tambien confirmo un 500
  simulado con mensaje generico en la UI y sin informacion interna.

Validaciones: 104 pruebas frontend, typecheck, build:production (2668 modulos),
git diff --check y 17 pruebas backend focalizadas correctas. El 500 fue
simulado en el navegador y no genero log de backend; la correlacion real se
verifico con el 400. Dos pruebas ajenas de `tests.test_api_responses` siguen
fallando por expectativas antiguas sobre detalles arbitrarios del backend.

### ISS-21: indicar campos obligatorios en todos los formularios

- Se revisaron los formularios de autenticación, catálogos, grupo, memorias,
  personal, producción, proyectos, recursos y transferencia. Los campos que
  impiden guardar sin valor muestran el asterisco rojo existente de `Field`.
- Se marcaron también los campos condicionales de becas, directivos y
  coordinador, y controles con etiqueta propia. Los campos opcionales
  permanecen sin marca. No se cambiaron reglas de validación ni contratos API.
- Se actualizó la documentación de frontend de los módulos afectados. La
  comprobación visual de Proyectos y Documentación fue confirmada por el
  usuario tras reiniciar el contenedor de desarrollo.

Validaciones: 104 pruebas frontend, typecheck, build:production con 2668
módulos, 74 pruebas backend focalizadas y git diff --check correctos. El build
por defecto requirió ejecutarse fuera del sandbox local porque esbuild no podía
leer `vite.config.ts` dentro de él; terminó correctamente.

### ISS-17: permitir presentaciones futuras sin referencias internas

- Los trabajos en reuniones admiten fechas de presentación futuras en altas y
  ediciones para registrar actividades ya programadas; conservan formato civil
  y límite institucional inferior del 01/01/2010.
- El formulario informa explícitamente que acepta presentaciones programadas y
  mantiene los errores seguros y accionables sin mostrar la referencia interna
  de seguimiento.
- Se actualizaron los contratos documentados y las regresiones de frontend y
  backend. La aceptación manual fue confirmada por el usuario.

Validaciones: 4 pruebas backend focalizadas, 103 frontend, typecheck,
build:production con 2668 módulos y git diff --check correctos.

### ISS-16: configurar períodos y snapshots de memorias por UCT

- Cada memoria pertenece a una UCT y admite un rango inclusivo configurable,
  incluso entre años. Se impiden solapamientos dentro de la misma UCT y se
  permite una memoria operativamente activa por UCT.
- ADMIN y GESTOR pueden crear y corregir períodos antes del primer cierre;
  LECTURA conserva consulta y recibe 403 ante mutaciones. La UI incorpora el
  selector de UCT, atajo de año calendario, rangos completos y errores visibles.
- La ruta de `Nueva` usa la misma autorización ADMIN/GESTOR que el home y deja de
  redirigir a gestores autorizados. El detalle muestra `Cerrar memoria` de forma
  explícita; `Seleccionar`, destinado a la baja múltiple, sigue limitado a ADMIN.
- ADMIN y GESTOR pueden pasar la memoria a revisión o cerrarla. El rango no
  provoca un cierre automático: la transición explícita congela los snapshots.
  Reapertura y baja continúan reservadas a ADMIN.
- El historial presenta la sigla de la UCT en lugar de su ID, también para
  asignaciones anteriores que ya habían guardado el identificador técnico.
- El cierre congela entidades según UCT y vigencia histórica, incluido el fin
  funcional de proyectos y las bajas lógicas. Las horas corresponden al valor
  vigente al final del período; si no existe evidencia histórica quedan nulas.
- La sección de elementos conserva el diseño anterior: muestra cantidades y abre
  cada módulo filtrado por los registros incluidos, sin desplegables de datos en
  las tarjetas. Los snapshots continúan disponibles para reglas y exportación.
- Se congelan contexto institucional, autoridades, planificación, fecha de alta
  y campos de cada entidad. UI y Excel leen la versión cerrada sin reconstruirla
  desde datos actuales. Cambios de período, estado y reaperturas quedan auditados.
- Migración reversible `e16a0b2c4d60` aplicada al PostgreSQL local. Para poder
  ejecutarla se transfirió al usuario de la aplicación la propiedad de las cinco
  tablas afectadas, permiso REFERENCES sobre `grupo_utn` y CREATE en `public`.
- Contratos, permisos, reglas temporales y limitaciones se documentaron en los
  módulos de memorias, grupo, personal, proyectos, producción, recursos y
  transferencia de backend, y en memorias/grupo de frontend.

Validaciones: 25 pruebas backend focalizadas, 119 de Memorias, 101 frontend, typecheck,
build:production, migración upgrade/downgrade temporal y aplicación local.
La suite backend completa ejecutó 416 pruebas: 412 correctas y cuatro incidencias
ajenas ya existentes (dos expectativas obsoletas del filtrado seguro de detalles,
una tilde esperada por Search y un archivo SQLite concurrente retenido en Windows).
`aaferrando` no existe en la base local, por lo que no se asignó ni elevó un rol.
La aceptación visual y el circuito con ese usuario quedan pendientes del usuario.

### ISS-14: agregar un enlace opcional al trabajo

- Congresos/reuniones y revistas permiten crear, editar y quitar un enlace
  HTTP/HTTPS opcional, hasta 2048 caracteres, con DOI mediante URL completa.
  Validaciones frontend/backend y errores asociados al campo; apertura segura
  y accesible desde detalle en pestaña nueva.
- Cambios reales auditados; snapshots conservan el enlace original y exportaciones
  de memoria/grupo lo incluyen sin alterar las columnas de la plantilla.
- Migración reversible d14e8f0a3c51 aplicada a PostgreSQL local de testeo:
  cuatro columnas nullable, 13 trabajos de cada tipo conservados con enlace null.
- Documentados contratos, permisos y validaciones en producción y memorias.

Validaciones: 65 tests backend correctos, tres de enlaces reejecutados tras
validar hosts inválidos, 97 frontend, typecheck, build:production y diff --check.
Upgrade/downgrade y snapshots/Excel inmutables probados en SQLite temporal.
HTTP autenticado 200 y módulos Vite actualizados; backend/frontend reiniciados.
Dos fixtures de snapshots actualizados al campo nuevo tras la primera ejecución.
Build inicial limitado por sandbox; compilación autorizada posterior correcta.
Revisión de navegador a cargo del usuario. No se implementa el plan de ISS-16.


### ISS-13: sustituir Fecha de inicio por Fecha de presentación

- Trabajos en congresos/reuniones y snapshots usan fecha_presentacion.
  Actualizados formulario, detalle, home, historial, filtro anual, búsqueda,
  exportaciones, seed y contratos; revistas mantiene su contrato.
- Compatibilidad temporal de entrada con fecha_inicio; valores contradictorios
  se rechazan sin escritura. Nuevas respuestas/eventos usan el nombre nuevo;
  historial antiguo conservado y presentado con la nueva etiqueta.
- Migración reversible c13d7e9a2b40 aplicada a PostgreSQL local de testing.
  Las trece fechas existentes se conservaron exactamente, sin regenerar datos.
- Pertenencia anual inclusiva por fecha de presentación, verificada para
  31 de diciembre y 1 de enero y en exportación XLSX.

Validaciones: 62 tests backend, 96 frontend, typecheck, build:production y
git diff --check correctos. Migración/downgrade con preservación de valores
probados en SQLite; consultas Docker autenticadas HTTP 200 y módulos Vite
actualizados. Revisión de navegador a cargo del usuario. El primer test XLSX
asumía otro formato de fecha; expectativa ajustada al contrato ISO existente.

### Agregado

#### ISS-12: investigadores y becarios como autores de trabajos

- Autoría común `autores` en congresos y revistas, identificada por rol/id.
  Únicamente investigadores y becarios; Personal y externos se rechazan.
- Backend con integridad referencial, permisos, transacciones atómicas,
  auditoría y snapshots de autores congelados. Formularios con altas/bajas
  locales, guardado consolidado y envío de diferencias reales.
- Buscador por nombre, apellido o iniciales sin tildes, filtro por categoría,
  nueve resultados y Ver más. Añadir requiere un botón explícito; escribir,
  perder foco o Enter en búsqueda no incorpora autores ni envía el formulario.
- Detalles, búsqueda global y exportaciones XLSX muestran autores.
  Corregida la ruta de la plantilla de memorias; contratos documentados.
- Revisiones de esquema aplicadas en PostgreSQL local hasta `b12c8d5e7f90`.
  Seed idempotente: 13 trabajos y 26 asociaciones por tipo. Entorno regenerable
  por decisión del usuario; downgrade estructural sin recuperación de datos.
- Frontend Docker actualizado y módulos servidos comprobados por HTTP.

Validaciones: 95 tests frontend, 18 backend de autores/historial y regresión
previa de 85 tests backend; typecheck, build:production y git diff --check
correctos. SQL PostgreSQL upgrade/downgrade y único head verificados. HTTP real:
consultas 200 y Personal rechazado con 400 sin cambios parciales. Revisión
de navegador a cargo del usuario. Incidencia ajena conservada: un test de
búsqueda espera `numerico` mientras la API devuelve `numérico`.

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

#### ISS-10: cierre aceptado de asignacion del coordinador

- El usuario acepta el cierre definitivo de ISS-10 el 2026-09-13.
- Completados coordinador e integrantes con guardado consolidado, preservacion
  del historial, altas con fecha de fin y feedback de guardado.
- Cierre y aceptacion registrados en tasks/finished/ISS-10.md; sin trabajo de
  implementacion pendiente. Las mejoras globales de botones corresponden al
  seguimiento de ISS-09.

Validaciones registradas: 46 tests backend de Personal/Proyectos; 85 frontend,
typecheck, build de produccion y diff check correctos. Pruebas de navegador
a cargo del usuario. El agente no las declara ejecutadas. Persisten las
incidencias previas documentadas del launcher del venv y warnings SQLite.
tasks/ sigue ignorado por la configuracion existente; no se cambia esa regla.

#### ISS-08 — Unificar la tarea y sus seguimientos

- Se integraron los documentos de alta PTAA, feedback de fechas/sesión y horas
  semanales/catálogo en `tasks/finished/ISS-08.md`, en orden de implementación.
- Se conservaron los cambios, archivos, validaciones, incidencias y estados de
  aceptación manual de cada etapa, junto con la metadata histórica.
- Se retiraron los dos archivos de seguimiento redundantes y se corrigió el
  espacio sobrante de `ISS-04 .md`, ahora `ISS-04.md`, sin cambiar su contenido.
- Se registró en AGENTS.md la convención `ISS-XX.md`: un archivo por issue y
  seguimientos dentro del mismo documento, en orden temporal.

Validaciones: contenido original preservado en la consolidación, contenido de
ISS-04 idéntico por SHA256 y revisión de nombres y referencias. No se modificó
código ni se ejecutaron commits. `tasks/` continúa ignorado por Git según la
configuración existente del usuario.

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

#### ISS-09 (seguimiento) — Evitar error duplicado de fecha de inicio

- En el formulario de proyecto, el calendario muestra la ayuda de formato y
  `Field` conserva el único mensaje de error de fecha de inicio.
- Se mantiene la validación existente; el usuario detectó la duplicación al
  intentar guardar el formulario vacío durante la prueba manual.

Validaciones: 81 pruebas frontend, `npm run typecheck`,
`npm run build:production` y `git diff --check`: correctos.
Pendiente confirmación visual del usuario.

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
- El indicador de renovación se alineó a la derecha de `Continuar sesión`; mantiene
  bloqueo, anuncio accesible y respeto por reducción de movimiento. El usuario
  validó manualmente la aparición del diálogo y la renovación.
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

## 2026-09-13 - ISS-11: feedback del selector de investigadores en trabajos

- Reuniones y revistas muestran carga inicial, lista vacia y error con Reintentar.
- Bloquean guardar sin datos; conservan opciones en refetch y selecciones ante fallos.
- Componente exclusivo del modulo; contratos, permisos y hooks compartidos intactos.
- Validacion: 88 tests frontend, typecheck y build:production correctos.
- Inspeccion previa: endpoint real HTTP 200 con dos investigadores activos; incidencia original no reproducida.
- Navegador a cargo del usuario; ampliacion de autoria permanece en ISS-12.

Validacion backend: 28 tests correctos de historial de trabajos en reuniones/revistas y errores de dominio de produccion (unittest).
