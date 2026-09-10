# Changelog

Este archivo registra los cambios funcionales y correcciones derivados del
testing del sistema GIDAS.

El formato se basa en Keep a Changelog y las versiones siguen versionado
semántico cuando se publica una entrega.

## [Sin publicar]

### Corregido

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
