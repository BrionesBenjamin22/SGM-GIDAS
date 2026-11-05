# Memorias

## Contrato consumido por la validacion preventiva (ISS-33)

Creacion y correccion de periodo conservan validaciones de UCT, fechas, estado y diferencias, sin modificar versiones cerradas ni sus fotos.

El frontend reutiliza sus comprobaciones durante la interaccion y muestra
conjuntamente los errores al guardar. Los errores de campo de la API mantienen
`error.details.fields`; los no asociados a un control conservan feedback general.
La etapa no cambia endpoints, payloads, modelos, permisos ni eventos auditados.
Escribir o corregir un campo no genera una mutacion de dominio; la autoridad
definitiva sigue siendo el backend. Aceptado por el usuario el 05/11/2026.

## Moneda en Equipamiento y Transferencias

Al cerrar una versión se copian importe original y `moneda` ARS/USD de cada
equipamiento y transferencia. Las lecturas de esas fotos devuelven la moneda
guardada; editar la ficha operativa no modifica una versión anterior. Las fotos
heredadas se identifican como ARS sin cambiar sus importes.

El Excel institucional conserva las celdas numéricas y la disposición de la
plantilla; el formato de cada importe indica ARS o USD. No calcula conversiones.
La exportación de grupo incorpora la columna Moneda y separa los totales de
transferencias por moneda. Las regresiones de formato y preservación del importe
están en `tests/test_memoria_excel_formato.py`.

## Nombres estructurados de Personal (ISS-34)

Los nuevos snapshots de Personal, Becario e Investigador componen el nombre como
`Nombre, APELLIDO` a partir de sus campos independientes, conservando nombres y
apellidos compuestos. El Excel del grupo usa la misma función
`personal.services.nombre_service.nombre_para_memoria`; por ejemplo,
`María del Carmen, DE LA CRUZ`. Si una fuente anterior no tiene datos estructurados,
conserva su texto completo. Las versiones ya congeladas siguen exportando su
snapshot original y no se reescriben por la normalización del dataset ficticio.
El contenido real del Excel de las tres clases y el formato institucional están
cubiertos por las regresiones backend; aceptación del usuario el 04/11/2026.

## Continuidad de acceso (ISS-52)

La corrección de navegación ADMIN agrega el enlace a Memorias en frontend y
no modifica el contrato backend. Listado y detalle siguen disponibles con la
versión actual cerrada. Alta, cierre y reapertura conservan autorización
ADMIN/GESTOR, validaciones de UCT, auditoría y snapshots existentes. Reabrir
crea una nueva versión abierta y preserva la cerrada; exige que no exista otra
memoria abierta o en revisión en la UCT.

## Excel institucional y seed de validación (ISS-94)

`GET /api/v1/memorias/{id}/versiones/{version_id}/exportar-excel` requiere
ADMIN o GESTOR y una versión cerrada con contexto institucional válido. El
exportador lee únicamente snapshots y completa
`backend/assets/Memorias 2025 - GIDAS.xlsx` mediante `memoria_excel_template.py`.
Conserva las dos hojas, encabezados, combinaciones, dimensiones, bordes y
configuración de impresión. Cuando una tabla excede sus filas disponibles,
inserta filas copiando su formato y desplaza las secciones siguientes. Los datos
usan Calibri 11 negro; los títulos mantienen su diseño institucional. Los textos
largos ajustan su altura y las celdas se escriben como datos, sin ejecutar fórmulas.

El cierre congela identificación, autoridades, planificación del año siguiente
y resultados de informes PID asociados. Las horas y relaciones corresponden al
período inclusivo y a la UCT de la memoria; no se reconstruye una versión cerrada
desde datos actuales. La exportación financiera agrupa por fuente, separa egresos
corrientes/capital y utiliza `monto_equivalente_ars`; los ingresos aparecen una
sola vez. La conversión USD/ARS se conserva desde el movimiento hasta el snapshot.

La seed es optativa e independiente de la seed genérica:

```text
python tools/seed_memoria_2025.py --help
python tools/seed_memoria_2025.py --scenario-2026 --group-id 1 --user-id 1
```

El modo institucional 2025 lee la referencia y requiere una base exclusiva de
testing; sus opciones permiten inicializar usuarios, cerrar por los servicios
reales y exportar. El escenario 2026 usa `seed_memoria_validacion.py`, admite sólo
desarrollo/testing, exige GIDAS y un ADMIN activo y ejecuta simulación por defecto.
`--apply` persiste y `--replace-2026` solicita la limpieza delimitada, dentro de la
misma transacción; realizar un respaldo antes de usar esta última opción. Preserva
credenciales, otras UCT y snapshots históricos. Los hechos llegan al 02/10/2026,
incluye controles de 2025 y respeta duraciones iniciales PID de 12 a 36 meses.
Este escenario no crea memorias ni genera Excel: el operador selecciona el período
y valida el flujo desde la interfaz. Los datos ficticios tienen redacción formal.

Pruebas: `test_memoria_excel_formato`, `test_memoria_2025_seed` y
`test_memoria_seed_validacion` verifican desbordes, estilos, filtros, idempotencia,
protección de datos existentes e inmutabilidad histórica.

## Listado y snapshots paginados (ISS-89)

`GET /api/v1/memorias` cuenta las Memorias filtradas y limita la consulta
antes de precargar versiones de la pagina. Las 16 colecciones de snapshots de
`/memorias/{id}/versiones/{version_id}/<coleccion>` consultan el total y
aplican `LIMIT/OFFSET` por version antes de serializar. Se conserva el array
anterior sin `page` ni `per_page`; con esos parametros se devuelve
`data`/`meta`/`error`, sin alterar las fotos historicas, su orden ni el
aislamiento UCT. El historial mantiene tres cambios por pagina.

## Contrato de listado y versiones (ISS-86)

`GET /api/v1/memorias?activos=true|false|all` devuelve una entrada por Memoria
con período, UCT, `version_actual`, `version_actual_id` y
`cantidad_versiones`; no incluye la colección completa de versiones.
`GET /api/v1/memorias/{id}` agrega `versiones` ordenadas por número y excluye
versiones con baja lógica. El frontend consulta este detalle solo al expandir
la fila correspondiente y pagina el listado por Memorias, no por versiones.
La expansión no muta datos ni cambia los permisos de lectura. Las transiciones
de estado, reapertura, snapshots y baja conservan sus endpoints y reglas
vigentes.

## Conteo de versiones cerradas (ISS-84)

El listado obtiene el total de elementos de cada version cerrada mediante una
consulta de agregacion sobre las tablas de snapshots. Se cuentan solo filas de
la version solicitada que no tienen baja logica y, cuando la tabla almacena la
UCT, solo las de la UCT activa. Las versiones abiertas siguen mostrando cero.
El contrato de `GET /api/v1/memorias` y las fotos historicas no cambian.

## Aislamiento de snapshots por UCT (security-multitenancy-uct)

Cada memoria y sus versiones pertenecen a la UCT de la sesion. La generacion
de snapshots exige una memoria con UCT y filtra todos los origenes por ella.
Una fila historica cuyo origen pertenece a otra UCT no se serializa. El
contexto institucional congelado se entrega y exporta solo si su grupo
coincide con la memoria; un contexto inconsistente no se reconstruye desde
datos actuales. Detalles, historiales y exportaciones siguen la misma regla.
Vease [Aislamiento de datos por UCT](../SECURITY_MULTITENANCY_UCT.md).

Las versiones nuevas capturan `MovimientoMemoriaVersion` con tipo, importe,
moneda, grupo y nombres de fuente o categoría. La exportación usa esas fotos
inmutables y separa ingresos, egresos corrientes y egresos de capital. Los datos
anteriores del entorno eran ficticios; no se conservaron mediante migración
controlada. La clave de sección `erogaciones` del endpoint de snapshots se
mantiene por compatibilidad interna con Memorias.

## Contrato de fechas

Los períodos de memoria se validan desde el 01/01/2010 y deben conservar el
orden cronológico y la pertenencia al rango configurado. Las marcas de
apertura y cierre son timestamps de workflow y no fechas ingresadas de un ítem.

## ISS-19: validación de formularios

POST `/api/v1/memorias` y PUT `/{id}` mantienen los códigos de dominio y devuelven `error.details.fields` para UCT, inicio y fin del período cuando el dato es corregible. El alta también informa `fecha_apertura` inválida. Un período superpuesto indica ambas fechas; una memoria activa de la UCT indica la selección. Las validaciones fallidas no persisten la memoria ni generan auditoría.

## ISS-12: autoría de integrantes

Los snapshots de ambos tipos de trabajos almacenan autores como JSON con identidad compuesta (rol, id), nombre y categoría al cierre. La exportación incluye todos los autores; revistas los agrega en la celda de título para conservar las seis columnas de la plantilla. Corregida la resolución de la ruta de la plantilla hacia backend/assets. El cambio de esquema de testing no conserva snapshots anteriores: regenerar datos y cerrar versiones nuevas.

Corrección de alcance ISS-12: los autores de trabajos son únicamente investigadores y becarios. Personal (PTAA/profesional) no puede vincularse como autor. Se mantiene la etiqueta Autores.

## ISS-13: pertenencia anual de ponencias

Trabajos de congresos/reuniones se incorporan al snapshot por
fecha_presentacion dentro del período inclusivo de la memoria. Ambas columnas
de fecha (trabajo y snapshot) se renombran preservando sus valores. Exportación
de grupo y XLSX de memoria usan fecha_presentacion; el encabezado de reuniones
es Fecha de presentación. Revistas y fechas de otras entidades no cambian.

## ISS-14: enlace congelado de trabajos

Snapshots de congresos/reuniones y revistas copian `enlace` opcional al generarse.
La migración añade una columna nullable a ambas tablas históricas; snapshots
existentes conservan null, sin inventar enlaces desde registros actuales.
GET de snapshots serializa el valor congelado; Excel de memoria incluye
Enlace en la celda del título para conservar las columnas de la plantilla.
Excel de grupo incluye el enlace actual en el título. Los enlaces son texto,
sin fórmulas ni consultas remotas. Editar el trabajo no altera snapshots cerradas.
Las reglas de pertenencia y permisos no se modifican en esta tarea.

## ISS-16: períodos configurables por UCT

POST `/api/v1/memorias` requiere `grupo_utn_id`, `periodo_inicio` y `periodo_fin`. El rango puede cruzar años, es inclusivo y no puede solaparse con otra memoria de la misma UCT. ADMIN y GESTOR pueden crear y corregir fechas; la UCT solo puede asignarse a una memoria anterior sin asociación. Las correcciones, transiciones de estado y reaperturas se registran en `auditoria_campo`, consultable mediante GET `/{id}/historial`. El período se bloquea si existe una versión cerrada.

ADMIN y GESTOR pueden cambiar una memoria entre abierta, en revisión y cerrada;
la finalización del período no produce un cierre automático porque el cierre es
la operación que congela los snapshots. La reapertura admite ADMIN y GESTOR;
la baja permanece reservada a ADMIN. En el historial, `grupo_utn_id` se presenta con la sigla de
la UCT y los registros anteriores que conservan un ID se resuelven al consultar.

El cierre selecciona cada entidad por UCT y por fecha puntual o solapamiento del intervalo funcional completo, incluyendo la baja lógica. La transacción revierte estado y fotos si falla cualquier generador. Las horas de integrantes corresponden al historial vigente al fin del período y quedan nulas si no existe evidencia. Se congelan además fecha de alta, datos institucionales, autoridades y planificación. UI y Excel leen estas fotos; una versión anterior sin contexto congelado no se reconstruye desde datos actuales.

La migración reversible `e16a0b2c4d60` conserva memorias existentes con UCT nullable. Una memoria previa abierta debe asociarse explícitamente antes de cerrar. El aislamiento de usuarios por pertenencia UCT se aplica como se describe arriba.

## Logros PID en la memoria (ISS-94)

El cierre copia `ProyectoInvestigacion.logros_obtenidos` al snapshot del PID,
incluido en las respuestas de proyectos de la versión. El renderer utiliza ese
valor para la columna de logros; mantiene `contexto_institucional.logros_proyectos`
como compatibilidad con resultados de informes congelados en versiones anteriores.
Las correcciones del proyecto o sus informes no reescriben una versión cerrada.

## Reapertura y diagnóstico de rendimiento (ISS-94)

PUT `/{id}/reabrir` requiere ADMIN o GESTOR, memoria activa, versión actual cerrada
y ausencia de otra memoria abierta/en revisión en su UCT. Crea una versión abierta
con número consecutivo y cambia `version_actual_id`; la anterior permanece cerrada.
No cambia período ni UCT y los nuevos snapshots se crean al cerrar la nueva versión.
PUT `/{id}/estado` conserva transiciones abierta a revisión/cerrada y revisión a
abierta/cerrada. Una versión histórica no admite cambios de estado. LECTURA consulta
datos e historial y no puede ejecutar estas acciones; DELETE sigue reservado a ADMIN.

El diagnóstico del 02/10/2026 encontró cierres reales de 23,6 a 24,6 s. La captura
de relaciones genera consultas repetidas y autoflush; el control de escritura por
UCT valida pertenencias por registro y constituye el costo principal observado.
La primera consulta del listado PID tardó 1,65 s y la siguiente 0,60 s. La medición
con cProfile añade sobrecosto y no representa una garantía de tiempos. Esta etapa
documenta el diagnóstico: no aplica optimización ni modifica controles de seguridad.

## Recoleccion durante el cierre (ISS-94)

Al cerrar una version, MemoriaService recolecta contexto y snapshots bajo
`db.session.no_autoflush`. El commit posterior sigue ejecutando la
validacion UCT y persiste el estado y todas las capturas en la misma
transaccion. Si falla un paso se mantiene el rollback del flujo.
En pruebas sin contexto Flask se usa `nullcontext`.

La captura de transferencias asigna sus vinculaciones mediante relaciones
ORM sin flush individual por registro. Las validaciones de claves
foraneas se agrupan por modelo/columna en la politica UCT y se vuelven a
ejecutar en cada flush; no se cachean resultados de autorizacion.

Se mantienen transiciones, permisos, fechas, auditoria, inmutabilidad y
datos de Excel. La comparacion de 296 registros capturados, incluidos
adoptantes, conserva su contenido de negocio. El diagnostico local
redujo el cierre de 1540 a 413 consultas, con tiempos variables; no es
una garantia de duracion para otros volumenes. La suite de cierre,
snapshots, exportacion y aislamiento forma parte de los 648 casos
backend correctos de esta etapa.

## Personal histórico y corrección de clase

Las fotos de Personal, Becario e Investigador conservan sus datos, etiquetas,
horas y clase al corregir un alta errónea en el registro actual. Se relacionan
con `IdentidadPersonal` mediante `identidad_id`; el ID original de clase queda
como procedencia histórica. Las lecturas y el Excel utilizan los campos de la
foto y no completan información con la ficha actual. El contrato de captura
agrega únicamente la referencia de identidad, nullable para datos heredados.

Reabrir genera una versión vacía; al cerrarla se captura la clase corregida,
respetando las reglas existentes de UCT, período e intervalos de horas. Una
persona no se incorpora a dos clases por conservar fotos de versiones anteriores.
Los permisos y endpoints de versiones y exportación conservan sus contratos.

Este alcance admite corregir un alta errónea; no define cambios de categoría
posteriores durante la trayectoria. Las relaciones operativas con becas,
proyectos, autorías o antecedentes continúan bloqueando el traslado y no se
eliminan. La migración y sus condiciones de reversión se detallan en Personal.
Las pruebas comparan fotos y celdas Excel de seis correcciones sucesivas, con
aislamiento UCT y conservación de contenido durante la migración.
