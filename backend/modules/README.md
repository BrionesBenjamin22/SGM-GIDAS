# Backend modular

Este directorio organiza el backend como monolito modular. Cada modulo agrupa
archivos por responsabilidad tecnica interna:

- `models`: modelos SQLAlchemy y relaciones persistentes.
- `services`: reglas de negocio, validaciones, auditoria y consultas.
- `controllers`: adaptacion HTTP, payloads y respuestas.
- `routes`: blueprints Flask, permisos y endpoints.

`modules/__init__.py` expone el registro central de blueprints usado por la
aplicacion. Las carpetas antiguas `core/models`, `core/services`,
`core/controllers` y `core/routes` quedan como fachadas de compatibilidad para
imports historicos.

## Modulos

- `auth`: usuarios, roles, personas asociadas, login, registro y cambio de
  contrasena.
- `catalogos`: catalogos transversales como categorias UTN y fuentes de
  financiamiento.
- `dashboard`: consultas agregadas para vista general.
- `grupo`: grupo UTN, directivos, cargos, planificacion, programas y visitas.
- `memorias`: periodos, versiones, exportacion y reglas de armado de memoria.
- `personal`: investigadores, becarios, personal, tipos de dedicacion,
  formacion y personal.
- `produccion`: produccion academica y cientifica, autores, documentacion,
  registros, distinciones y actividades docentes.
- `proyectos`: proyectos de investigacion, tipos de proyecto y participaciones
  relevantes.
- `recursos`: becas, equipamiento, erogaciones y tipos de erogacion.
- `search`: busqueda transversal y registro de entidades buscables.
- `shared`: auditoria, mixins, middleware, validaciones y healthcheck.
- `transferencia`: transferencia socio-productiva, adoptantes y contratos.

## Convenciones

- Las nuevas funcionalidades deben agregarse dentro del modulo de dominio
  correspondiente.
- Los imports nuevos deben preferir `modules.<modulo>...`.
- Los imports `core.*` se mantienen solo para compatibilidad durante la
  migracion.
- Los endpoints deben declarar permisos en `routes` y delegar reglas de negocio
  a `services`.
- Todo cambio con historial o auditoria debe reutilizar los servicios de
  `shared` y las reglas existentes de `memorias` cuando corresponda.
