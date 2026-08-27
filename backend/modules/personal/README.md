# Modulo backend de personal

## Responsabilidad

Gestiona investigadores, becarios, PTAA, profesionales, tipos asociados,
pertenencia al grupo, carga horaria, proyectos y relaciones con becas.

## Estructura

- `routes`: endpoints bajo `/api/v1/personal`.
- `controllers`: traduccion HTTP y errores seguros.
- `services`: validacion, transacciones, auditoria e historial.
- `models`: entidades, relaciones, soft delete y snapshots de memorias.

## Contratos modificados

### Actualizar becario

```http
PUT /api/v1/personal/becarios/{id}
```

Acepta campos parciales. `becas`, cuando se envia, representa el estado final
deseado de relaciones activas:

```json
{
  "nombre_apellido": "Nombre Apellido",
  "becas": [
    {
      "beca_id": 3,
      "fecha_inicio": "2026-04-01",
      "fecha_fin": null,
      "monto_percibido": 150000
    }
  ]
}
```

El service valida todas las relaciones y aplica altas, bajas y cambios en la
misma transaccion que los campos del becario. No realiza commits intermedios.
Una lista vacia desvincula todas las relaciones activas.

## Reglas y validaciones

- IDs positivos y sin duplicados.
- Fechas en formato `YYYY-MM-DD` y fin no anterior al inicio.
- Monto numerico no negativo.
- Becario, beca, tipos y grupo deben existir y estar activos.
- Las actualizaciones aceptan payload parcial.
- Las bajas funcionales usan soft delete.

## Permisos

- lectura e historial: `ADMIN`, `GESTOR`, `LECTURA`
- alta, actualizacion, relaciones y baja: `ADMIN`, `GESTOR`

## Auditoria

- cambios de campos se registran por atributo
- vincular, actualizar o desvincular becas genera eventos relacionales sobre
  la entidad `becario`
- el historial de carga horaria conserva sus periodos propios
- los snapshots de memorias cerradas no dependen del estado vivo posterior

## Errores

Los errores de validacion se devuelven como 400. Los errores inesperados no
deben exponer secretos ni detalles internos. La transaccion debe revertirse
completa ante cualquier fallo.

## Pruebas relacionadas

- `tests/test_personal_relaciones_consolidadas.py`
- `tests/test_auditoria_personal_services.py`
- pruebas `*_memoria_historial.py` de personal

## Datos ficticios de testing

El seed integral crea doce registros deterministas para cada categoria visible:
Tecnico administrativo y de apoyo, Profesional, Becario e Investigador. Varia
fecha de alta y carga horaria para habilitar pruebas manuales de filtros,
ordenamiento y paginacion. La carga es idempotente y mantiene la proteccion que
impide ejecutarla accidentalmente en produccion.
