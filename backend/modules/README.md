# Backend modular

Este directorio organiza el backend como monolito modular. Cada modulo agrupa
archivos por responsabilidad tecnica interna:

- `models`: modelos SQLAlchemy y relaciones persistentes.
- `services`: reglas de negocio, validaciones, auditoria y consultas.
- `controllers`: adaptacion HTTP, payloads y respuestas.
- `routes`: blueprints Flask, permisos y endpoints.

`modules/__init__.py` expone el registro central de blueprints usado por la
aplicacion. `modules/models_registry.py` importa explicitamente los modelos
modulares para registrar la metadata de SQLAlchemy durante el arranque. La
carpeta legacy previa a la modularizacion fue eliminada; los imports historicos
ya no forman parte del contrato interno del backend.

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
- Los imports deben usar `modules.<modulo>...`.
- No agregar nuevas fachadas legacy; cualquier compatibilidad historica debe
  resolverse migrando el import al modulo correspondiente.
- Los endpoints deben declarar permisos en `routes` y delegar reglas de negocio
  a `services`.
- Todo cambio con historial o auditoria debe reutilizar los servicios de
  `shared` y las reglas existentes de `memorias` cuando corresponda.

## Contrato de respuestas API

Las nuevas rutas y las migraciones progresivas deben usar los helpers de
`modules.shared.controllers.responses` para responder con una estructura estable.
El contrato base de exito es:

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

El contrato paginado agrega metadata estandar:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "per_page": 9,
    "total": 42,
    "total_pages": 5
  },
  "error": null
}
```

El contrato de error evita exponer detalles internos:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Lo sentimos, no pudimos guardar los cambios. Verifique los datos e intente nuevamente.",
    "details": {}
  }
}
```

Helpers disponibles:

- `success_response(data=None, meta=None, status_code=200)`.
- `paginated_response(data, page, per_page, total, meta=None, status_code=200)`.
- `error_response(code, message=None, details=None, status_code=400)`.

Durante la migracion, los endpoints legacy pueden conservar respuestas directas
si el frontend actual depende de ese contrato. Los endpoints nuevos o versionados
deben responder con `data`, `meta` y `error`.
