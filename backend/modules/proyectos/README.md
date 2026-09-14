# Modulo backend de proyectos

## Errores accionables (ISS-09)

Las selecciones inexistentes de tipo de proyecto, fuente de financiamiento,
grupo e investigador se informan mediante `VALIDATION_ERROR` (400) y
`error.details.fields`, indicando la selección que debe corregirse.
El código de proyecto conserva su regla vigente: texto alfanumérico de hasta
50 caracteres; ISS-09 no modifica esa regla. Los errores inesperados incluyen
`details.request_id` correlacionable con los logs y un mensaje seguro.

## Contrato de fechas

Los proyectos y sus relaciones se validan desde el 01/01/2010. Los services
mantienen el orden inicio-fin y la prohibición de cierres futuros.

## Responsabilidad

Gestiona proyectos de investigacion, sus tipos, participaciones relevantes y
relaciones con investigadores y becarios.

## Coordinador y guardado atómico (ISS-10)

`ProyectoGuardadoService` coordina los services del agregado sin commits
intermedios. POST `/api/v1/proyectos` y PUT `/api/v1/proyectos/{id}` mantienen
sus rutas y permisos ADMIN/GESTOR. Admiten las siguientes claves opcionales
además de los campos existentes:

- `investigadores_ids`: lista de IDs de investigadores, positivos, enteros y sin duplicados.
- `becarios_ids`: lista equivalente de becarios.
- `coordinador_id`: ID de un investigador de la lista final, o null si no hay investigadores.

Una clave omitida conserva su estado; una lista vacía desvincula sus integrantes.
Si se quita al coordinador, debe enviarse su reemplazo o null cuando la lista
queda vacía. Ejemplo de reemplazo sin alterar participaciones:
`{"coordinador_id": 2}`. Con investigadores seleccionados se exige exactamente
un coordinador; un proyecto sin investigadores puede no tener coordinador.

Las nuevas vinculaciones y promociones a coordinador requieren que el registro
exista en la tabla de su subtipo, esté activo y no tenga baja lógica. Se rechazan
bool, IDs inexistentes/inactivos y coordinadores externos al proyecto mediante
400 `VALIDATION_ERROR` con `error.details.fields`. Un coordinador inactivo ya
asignado puede conservarse, ser reemplazado o desvincularse sin borrar datos
históricos. La consulta de proyectos devuelve `activo` en sus investigadores
para que el detalle pueda indicar esta situación. Los proyectos que ya estaban
cerrados al iniciar una edición no admiten nuevas asignaciones. El alta permite
registrar un proyecto histórico con fecha de fin pasada o de hoy y guardar
sus integrantes y coordinador en la misma transacción; las participaciones
iniciales quedan con la fecha de fin del proyecto. Una fecha de fin futura
también se admite en alta y conserva el proyecto abierto; las participaciones
nuevas quedan sin cierre efectivo. Se mantiene la validación inicio-fin.

El cambio de rol modifica `es_coordinador` en la participación existente;
conserva ID y fechas. Las bajas usan soft delete. Se registran diferencias de
`coordinador_id`, eventos de altas/bajas relacionales y actor de auditoría, dentro
de la misma transacción que los campos. Cualquier fallo anterior al commit
revierte proyecto, relaciones e historial. PUT bloquea la fila del proyecto
con `FOR UPDATE`; las rutas relacionales existentes también obtienen ese bloqueo
para serializar cambios del agregado en PostgreSQL. No se modifican snapshots
ni versiones de memorias. No se requiere migración para el contrato agregado.

Pruebas de API y persistencia SQLite: `tests/test_proyecto_coordinador.py`.
El bloqueo concurrente PostgreSQL requiere comprobación en el entorno Docker;
SQLite no valida la semántica de `FOR UPDATE`.

## Contrato de errores

Los services distinguen validaciones (`VALIDATION_ERROR`), recursos inexistentes
(`NOT_FOUND`) y conflictos de estado o duplicidad (`CONFLICT`). Los controladores
serializan solo excepciones de dominio conocidas. Las fallas inesperadas se
registran de forma sanitizada y responden `INTERNAL_ERROR` con `request_id`.

## Código de proyecto

`codigo_proyecto` es una cadena alfanumérica obligatoria de hasta 50 caracteres.
El alta y la edición eliminan espacios exteriores, conservan mayúsculas y
minúsculas y aceptan únicamente el patrón `[A-Za-z0-9]+`.

El mismo tipo se conserva en los snapshots de proyectos y distinciones asociados
a versiones de memorias. La migración `c6e8a1f4b2d9` convierte las columnas
numéricas anteriores a `VARCHAR(50)` y preserva sus valores como texto.

Los errores de formato se devuelven como `VALIDATION_ERROR` con el mensaje del
campo en `error.details.fields.codigo_proyecto`.

## Permisos y trazabilidad

Las rutas mantienen los permisos definidos en el modulo. Altas, cambios,
relaciones, cierres y reaperturas conservan auditoria e historial.

## Pruebas relacionadas

- `tests/test_proyecto_domain_errors.py`
- `tests/test_proyecto_codigo_alfanumerico.py`
- `tests/test_proyecto_memoria_historial.py`
