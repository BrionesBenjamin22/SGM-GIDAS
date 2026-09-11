# Modulo backend de transferencia

## Contrato de fechas

Los períodos de transferencia se validan desde el 01/01/2010 y el fin no puede
ser anterior al inicio, tanto en alta como en edición.

## Responsabilidad

Gestiona transferencias socio-productivas, tipos de contrato, adoptantes y sus
relaciones, incluyendo auditoria, baja logica e historial.

## Contrato de errores

Los services distinguen validaciones (`VALIDATION_ERROR`), recursos inexistentes
(`NOT_FOUND`) y conflictos (`CONFLICT`). Los controladores usan el serializador
central y las fallas inesperadas responden `INTERNAL_ERROR` con `request_id` sin
exponer datos internos.

## Pruebas relacionadas

- `tests/test_transferencia_domain_errors.py`
- `tests/test_transferencia_memoria_historial.py`
