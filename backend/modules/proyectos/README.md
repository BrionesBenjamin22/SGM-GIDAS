# Modulo backend de proyectos

## Responsabilidad

Gestiona proyectos de investigacion, sus tipos, participaciones relevantes y
relaciones con investigadores y becarios.

## Contrato de errores

Los services distinguen validaciones (`VALIDATION_ERROR`), recursos inexistentes
(`NOT_FOUND`) y conflictos de estado o duplicidad (`CONFLICT`). Los controladores
serializan solo excepciones de dominio conocidas. Las fallas inesperadas se
registran de forma sanitizada y responden `INTERNAL_ERROR` con `request_id`.

## Permisos y trazabilidad

Las rutas mantienen los permisos definidos en el modulo. Altas, cambios,
relaciones, cierres y reaperturas conservan auditoria e historial.

## Pruebas relacionadas

- `tests/test_proyecto_domain_errors.py`
- `tests/test_proyecto_memoria_historial.py`
