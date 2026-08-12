# Modulo backend de grupo

## Responsabilidad

Gestiona la UCT, directivos, cargos, programas, planificaciones y visitas
academicas. Todas las rutas de dominio requieren rol.

## Planificaciones

Endpoints principales:

```text
GET    /api/v1/grupo/planificaciones/?page=1&per_page=9&activos=true
POST   /api/v1/grupo/planificaciones/
GET    /api/v1/grupo/planificaciones/{id}
PUT    /api/v1/grupo/planificaciones/{id}
DELETE /api/v1/grupo/planificaciones/{id}
GET    /api/v1/grupo/planificaciones/{id}/historial
```

El listado conserva compatibilidad sin parametros y adopta el contrato
paginado transversal cuando recibe `page` o `per_page`.

La actualizacion acepta payload parcial, valida unicidad por grupo y año,
registra solamente campos modificados y asigna `updated_by`.

## Directivos

Las relaciones entre directivo, cargo y grupo mantienen periodos de vigencia.
El frontend acumula cambios hasta guardar la UCT; las operaciones backend
continuan protegidas individualmente y registran historial relacional.

## Permisos

- lectura e historial: `ADMIN`, `GESTOR`, `LECTURA`
- altas, cambios, asignaciones, finalizaciones y bajas: `ADMIN`, `GESTOR`

## Auditoria y baja

- las entidades auditables usan `AuditMixin`
- las planificaciones registran historial bajo `planificacion_grupo`
- las bajas aplicables son logicas y preservan trazabilidad
- el historial se ordena desde el cambio mas reciente

## Pruebas relacionadas

- `tests/test_planificacion_historial.py`
- `tests/test_pagination.py`
- pruebas de auditoria de relaciones y visitas
