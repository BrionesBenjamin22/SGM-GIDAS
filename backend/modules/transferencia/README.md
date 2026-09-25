# Modulo backend de transferencia

El nombre de adoptante admite solo letras Unicode y espacios, tanto al crear
como al editar. Denominación y demandante requieren alguna letra. Los errores
identifican el campo en `details.fields`.

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

ISS-19: número, denominación, demandante, descripción, monto, fechas y tipo de contrato devuelven `error.details.fields` cuando identifican un dato editable. Las claves corresponden al payload HTTP; las fallas de grupo o relación sin control inequívoco permanecen como aviso general seguro.

Las altas y bajas de la relación de adoptantes responden con `error.details.fields.adoptantes_ids` si la selección no es válida. Un adoptante que ya no está disponible conserva `NOT_FOUND` y señala el selector.

El alta y la edición de un adoptante indican `nombre` si falta o está duplicado.

## Pruebas relacionadas

- `tests/test_transferencia_domain_errors.py`
- `tests/test_transferencia_memoria_historial.py`

## Snapshots de memorias (ISS-16)

Las transferencias se filtran por UCT y por solapamiento entre inicio, finalización, baja y período. Los adoptantes y vínculos vigentes quedan congelados con el snapshot padre; una baja posterior al inicio del período no borra la relación histórica.
