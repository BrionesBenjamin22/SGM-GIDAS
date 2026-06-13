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

## Versionado de API

Los blueprints se registran unicamente bajo `/api/v1`. No hay endpoints
publicos legacy sin prefijo.

La nomenclatura versionada se centraliza en
`modules.shared.routes.versioning.VERSIONED_PREFIXES`, agrupando endpoints por
dominio cuando corresponde. Ejemplos:

- `/api/v1/catalogos/fuente-financiamiento`
- `/api/v1/personal/investigadores`
- `/api/v1/recursos/becas`
- `/api/v1/produccion/articulos-divulgacion`
- `/api/v1/proyectos`
- `/api/v1/transferencia/transferencias`
- `/api/v1/grupo/cargos`

Toda respuesta servida desde `/api/v1` debe incluir el header:

```text
API-Version: v1
```

Regla de compatibilidad:

- Cambios compatibles permanecen en v1: campos opcionales, endpoints nuevos y filtros nuevos.
- Cambios incompatibles deben ir a una version nueva, por ejemplo v2.
- El frontend debe consumir la API con base versionada, por ejemplo
  `VITE_API_BASE_URL=/api/v1` o una URL equivalente que termine en `/api/v1`.

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

Los endpoints nuevos o versionados deben responder con `data`, `meta` y
`error`.

## Contrato de paginacion de listados

Los listados migrados deben aceptar estos parametros:

- `page`: pagina solicitada, entero positivo. Valor por defecto `1`.
- `per_page`: elementos por pagina, entero positivo. Valor por defecto `9`.
- `activos`: filtro de estado. Valores validos `true`, `false` o `all`.
- `orden`: direccion de ordenamiento. Valores validos `asc` o `desc`.

El limite general se configura con:

- `PAGINATION_DEFAULT_PER_PAGE`: por defecto `9`, alineado a homes.
- `PAGINATION_MAX_PER_PAGE`: por defecto `100`.

Durante la migracion incremental, un endpoint existente puede mantener su lista
plana si el cliente no envia `page` ni `per_page`. Cuando el cliente envia alguno
de esos parametros, el endpoint debe responder con `data`, `meta` y `error`.

Los listados que todavia devuelven una lista JSON plana quedan cubiertos
por `register_legacy_list_pagination(app)`: si reciben `page` o `per_page`, la
respuesta se adapta al contrato paginado. Este mecanismo da compatibilidad
transversal para todos los endpoints GET de listado mientras cada modulo se
optimiza progresivamente a paginacion a nivel de query.
