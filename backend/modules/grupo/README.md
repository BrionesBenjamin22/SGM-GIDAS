# Modulo backend de grupo

Los nombres de directivos admiten solo letras Unicode y espacios. Facultad
regional y nombre/sigla del grupo requieren alguna letra. Los errores
identifican el campo en `details.fields`.

Las altas de directivos y sus períodos indican `nombre_apellido`, `id_cargo`, `fecha_inicio` o `fecha_fin` mediante `error.details.fields` cuando el control admite corrección.

POST `/api/v1/grupo/directivos/crear-y-asignar` requiere ADMIN o GESTOR y recibe `nombre_apellido`, `id_grupo_utn`, `id_cargo` y `fecha_inicio`. Crea y asigna dentro de una sola transacción: un rechazo revierte ambos pasos. Los endpoints separados permanecen disponibles para otros clientes.

## Contrato de fechas

Visitas y mandatos directivos se validan desde el 01/01/2010. Los mandatos no
admiten fechas futuras y su finalización debe ser igual o posterior al inicio.

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

Cada UCT puede tener activos como maximo un `Director` y un `Vicedirector`. La
asignacion rechaza cargos diferentes, cargos inactivos, un cargo institucional ya
ocupado o un equipo que ya tenga cubiertos ambos cargos. Los periodos finalizados
se conservan para trazabilidad y no consumen el cupo activo.

La serializacion de la UCT incluye solamente participaciones vigentes y sin baja
logica cuyos directivo y cargo tambien permanezcan activos. El endpoint especifico
de directivos actuales mantiene el mismo criterio para el formulario y la home.

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
- `tests/test_grupo_domain_errors.py`

## Contrato de errores

Los services distinguen validaciones (`VALIDATION_ERROR`), recursos inexistentes
(`NOT_FOUND`) y conflictos de estado (`CONFLICT`). Los controladores serializan
unicamente errores de dominio conocidos; una falla inesperada responde
`INTERNAL_ERROR` con `request_id` y no expone detalles internos.

## Integración con memorias (ISS-16)

GET `/api/v1/grupo/grupo-utn/opciones` devuelve `{id, nombre}` de las UCT activas a ADMIN, GESTOR y LECTURA. Al cerrar una memoria se congelan la UCT, sus autoridades vigentes durante el período y la planificación del año siguiente; cambios actuales no alteran esa versión ni su Excel.

## Validaciones de Visitas (ISS-19)

El service de visitas responde VALIDATION_ERROR con error.details.fields para razon, procedencia, fecha, tipo_visita_id y grupo_utn_id cuando identifica el dato inválido. Las validaciones ocurren antes de persistir y conservan el rollback existente.

UCT identifica los campos obligatorios `nombre_unidad_academica`, `nombre_sigla_grupo`, `mail` y `objetivo_desarrollo`. Planificaciones identifica `descripcion` y `anio`, incluido un año ya planificado; los errores sin un control inequívoco mantienen un mensaje general.
