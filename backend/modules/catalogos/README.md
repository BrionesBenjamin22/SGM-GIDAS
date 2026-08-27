# Modulo backend de catalogos

Gestiona categorias UTN y fuentes de financiamiento con auditoria y baja logica.

## Contrato de errores

Los services clasifican validaciones (`VALIDATION_ERROR`), recursos inexistentes
(`NOT_FOUND`) y conflictos de duplicidad, estado o relaciones (`CONFLICT`). Las
fallas inesperadas se ocultan mediante `INTERNAL_ERROR` con `request_id`.

## Pruebas

- `tests/test_catalogos_domain_errors.py`
- `tests/test_catalogo_auditoria_service.py`
