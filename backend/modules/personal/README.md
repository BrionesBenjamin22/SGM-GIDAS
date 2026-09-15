# Modulo backend de personal

## Contrato de fechas

`fecha_alta_grupo` y los períodos de relaciones se validan desde el 01/01/2010.
El límite no corresponde a datos biográficos ajenos a la actividad del grupo.

## Responsabilidad

Gestiona investigadores, becarios, PTAA, profesionales, tipos asociados,
pertenencia al grupo, carga horaria, proyectos y relaciones con becas.

## Estructura

- `routes`: endpoints bajo `/api/v1/personal`.
- `controllers`: traduccion HTTP y errores seguros.
- `services`: validacion, transacciones, auditoria e historial.
- `models`: entidades, relaciones, soft delete y snapshots de memorias.

## Contratos modificados

### Alta de PTAA y profesional (ISS-08)

`POST /api/v1/personal` sin barra final crea una entidad `Personal` para ambas
categorías. El catálogo `tipo_personal_id` determina el tipo; no se requieren
formación, dedicación, categoría UTN ni incentivos de otros subtipos.

Payload obligatorio: `nombre_apellido` (hasta 120 caracteres),
`horas_semanales` (entero entre 1 y 168), `tipo_personal_id`, `grupo_utn_id` y
`fecha_alta_grupo` (`YYYY-MM-DD`, desde 2010-01-01). Tipo y grupo deben existir
y estar activos. El alta establece `activo=true` y registra `created_by`.

Devuelve 201 con la entidad serializada y su historial inicial de horas.
Inserción, flush, historial y commit se protegen con rollback completo.
Validaciones y referencias inválidas devuelven 400 con
`error.details.fields` (mapa de campo de payload a mensaje seguro).
Errores inesperados conservan el contrato compartido 500.

Listado: `/api/v1/personal/all`; detalle e historial:
`/api/v1/personal/personal/{id}` y su sufijo `/historial`. La búsqueda de
personal enlaza a `/personal/personal/{id}`. Profesional se persiste en la
misma tabla y utiliza el rol técnico `personal` para actualizarlo.

Pruebas: `tests/test_personal_alta_ptaa.py`, con SQLite aislado y autenticación
simulada; cubre alta, referencias, obligatorios, rollback, consulta, búsqueda,
permisos y regresión de los otros tipos.

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

Seguimiento ISS-08: `services/horas_validation.py` centraliza `horas_semanales`
como entero de 1 a 168 inclusive (7 días por 24 horas). Rechaza booleanos,
fracciones y cadenas sin coerción. Se aplica al crear/editar Personal, Becario e
Investigador, incluida la ruta genérica de actualización por rol. En edición
se valida antes de mutar campos o historiales. Una carga parcial sin horas no
reescribe valores históricos; no hay migración/corrección masiva de datos.
Devuelve HTTP 400 con `error.details.fields.horas_semanales`.

Personal acepta cualquier ID activo de TipoPersonal, sin exigir nombres
prefijados. El catálogo disponible excluye tipos con `activo=false` o soft delete.

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
# Candidatos de proyectos (ISS-10)

Seguimiento ISS-08: el listado combinado `/personal-all` (ruta canónica
`/api/v1/personal/all`) ordena todos los subtipos por `created_at` descendente,
con ID y rol como desempate determinista. Las altas recientes aparecen primero
en el home paginado. No se modifica el contrato de creación ni se requiere
migración. Regresión de orden entre subtipos y más de nueve registros:
`tests/test_personal_alta_ptaa.py`.

GET `/api/v1/investigadores/` conserva permisos ADMIN/GESTOR/LECTURA.
El listado por defecto y `activos=true` requieren `activo=true` y ausencia
de baja lógica. `activos=false` incluye inactivos o dados de baja; `all`
conserva todos. Esto evita ofrecer investigadores inactivos como candidatos
de coordinador sin alterar el hook compartido del frontend.

## ISS-12: autoría de integrantes

Las relaciones inversas de investigadores con trabajos se obtienen de autorias_reunion/autorias_revista. Se mantienen los datos de trabajos en la serialización de investigadores sin depender de tablas de asociación exclusivas. Investigadores y becarios son los únicos orígenes válidos de la colección común de autores de Producción; no se fusionan las tablas de personal.

Corrección de alcance ISS-12: los autores de trabajos son únicamente investigadores y becarios. Personal (PTAA/profesional) no puede vincularse como autor. Se mantiene la etiqueta Autores.

## Snapshots de memorias (ISS-16)

Personal, investigadores y becarios se seleccionan por UCT y solapamiento entre alta, baja y período. La foto conserva `fecha_alta_grupo`. `horas_semanales` representa el historial vigente al final del período y queda null cuando no hay evidencia, sin copiar horas actuales. Las becas usan sus intervalos completos.