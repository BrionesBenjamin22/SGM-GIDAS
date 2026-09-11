# Changelog

Este archivo registra los cambios funcionales y correcciones derivados del
testing del sistema GIDAS.

El formato se basa en Keep a Changelog y las versiones siguen versionado
semántico cuando se publica una entrega.

## [Sin publicar]

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
