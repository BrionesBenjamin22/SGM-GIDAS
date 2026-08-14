# Modulo backend de transferencia

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
