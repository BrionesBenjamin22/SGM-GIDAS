# Modulo backend de proyectos

## Contrato de fechas

Los proyectos y sus relaciones se validan desde el 01/01/2010. Los services
mantienen el orden inicio-fin y la prohibición de cierres futuros.

## Responsabilidad

Gestiona proyectos de investigacion, sus tipos, participaciones relevantes y
relaciones con investigadores y becarios.

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
