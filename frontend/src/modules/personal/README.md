# Modulo frontend de personal

## Errores por campo (ISS-09)

Los formularios del módulo consumen `error.details.fields` mediante
`applyFieldErrors` de `src/lib/httpError.ts`, muestran el mensaje junto al control
y enfocan el primer campo inválido. Los nombres locales de los controles se
vinculan con las claves API, sin cambiar el payload del service ni los permisos.
Los errores sin campo o con campos desconocidos conservan el aviso general;
los errores inesperados muestran una referencia de seguimiento cuando existe.
Se conservan las reglas y el momento de validación existentes. Véase el contrato
transversal en `../README.md`.

## Fechas

Seguimiento ISS-08: ingresar 2008 en una fecha de alta no cambia el valor
confirmado; Calendar explica el límite 01/01/2010 junto al campo y lo resalta.

Las altas al grupo y los períodos de sus relaciones admiten fechas desde el
01/01/2010. Esta regla describe actividad institucional y no debe extenderse a
fechas biográficas o de identidad.

## Vistas

- `PersonalHome`: listado con hasta 9 elementos por pagina.
- `PersonalForm` y formularios especializados: alta y edicion por tipo.
- `PersonalDetalle`: datos, auditoria e historial de cambios.

## Capas

- `services`: contratos HTTP y tipos TypeScript.
- `hooks`: consultas reutilizables con React Query.
- `pages`: estado de formulario, validacion y navegacion.
- `components`: piezas internas del modulo.

## Formularios

### Seguimiento ISS-08: listado actualizado y feedback de guardado

Las altas y ediciones de Investigador invalidan las consultas `personal`,
`investigadores` y `proyecto-candidatos` antes de navegar; la edición también
invalida su detalle y datos iniciales. Los tres formularios especializados
mantienen `isSaving` durante el envío y la actualización de consultas,
deshabilitan Guardar/Actualizar y muestran un icono de carga y `Guardando...`.
Un error libera el botón y conserva los datos para corregir o reintentar.

Las validaciones locales y los errores del servidor producen un aviso general
visible mediante la notificación existente. Los campos inválidos conservan
sus mensajes y se enfoca el primero con `focusFieldErrors`, haciendo visible
el problema aunque el usuario esté al final de un formulario extenso. Una
validación local no envía una petición al servidor.

El listado combinado de Personal muestra primero las altas más recientes,
sin cambiar el máximo de nueve elementos por página. Pruebas de formulario,
estado de carga, errores y actualización con React Query real:
`tests/personalGuardarFeedback.test.ts` y `tests/personalCatalogForm.test.ts`.

En edicion, investigador, becario, PTAA y profesional comparan el estado
normalizado con los datos iniciales y envian solo las diferencias reales. Si no
hay cambios no ejecutan el `PUT`, pero conservan la navegacion al detalle.

Las becas de un becario se editan localmente y se envian juntas en `becas` al
guardar. El frontend no desvincula ni vincula cada fila individualmente.

La selección inicial define la clase de registro: Personal, Becario o Investigador.
Las dos últimas requieren campos y relaciones especializados. Personal selecciona
`tipo_personal_id` desde todos los tipos activos del catálogo, con sus nombres e IDs
reales, sin filtrar por textos ni resolver automáticamente "Profesional".
`FormPTAAProfesional` conserva su nombre de archivo por compatibilidad, pero sirve
a cualquier tipo del catálogo. Las rutas existentes de edición se mantienen.

Todos los formularios usan las validaciones controladas por React, conservan los
valores ingresados cuando una validacion o peticion falla y muestran el mensaje
junto al campo correspondiente. Los errores no asociados a un campo se anuncian
como feedback general accionable.

## Navegacion

- alta: vuelve a `/personal` con `successMessage`
- edicion: vuelve al detalle del registro con `successMessage`

## Permisos y errores

La UI respeta permisos provistos por auth; el backend sigue siendo la autoridad.
Los formularios especializados informan sus fallos al contenedor `PersonalForm`,
que obtiene un mensaje seguro mediante `getErrorMessage` y lo presenta en un toast
visible. Una operacion fallida detiene la navegacion y nunca muestra exito.

Las cargas usan el mensaje accionable del proyecto. Los contratos aceptan el error
tipado `{ error: { code, message, details } }` y formatos heredados estructurados;
no se reflejan cuerpos de texto desconocidos ni se silencian fallos relacionales.

## Contratos y seguridad

`PersonalCompleto`, becas, catalogos, relaciones e historiales tienen tipos
explicitos. Los services declaran el resultado de altas, actualizaciones, consultas
y bajas. El modulo no usa `any`, HTML no confiable, storage ni `fetch` directo.

## Validaciones

### Corrección del alta PTAA (ISS-08)

`upsertPersonal` usa `POST /personal` sin barra final, conforme al endpoint
vigente. Todos los registros Personal seleccionan un tipo real del catálogo.
No se envían campos de investigador ni becario. Las horas deben ser enteras
entre 1 y 168 y el grupo debe estar disponible.

`utils/personalFieldErrors` interpreta `error.details.fields` solo para campos
conocidos. El formulario muestra errores junto a nombre, horas, tipo y fecha,
o como alerta local para el grupo; mueve el foco al campo afectado. Fallos sin
campo siguen el toast seguro del contenedor. No navega ni informa éxito si falla.
PTAA y Profesional usan `personal` como rol técnico de actualización y detalle,
ya que comparten entidad backend. Se mantienen la navegación de alta al home
y el envío exclusivo de diferencias en edición.

Pruebas automatizadas: `tests/personalAlta.test.ts` (contrato de ruta, mapeo de
errores y invariantes condicionales). No reemplazan la prueba manual del navegador.

- campos obligatorios y horas enteras entre 1 y 168
- fechas y tipos seleccionados
- becas sin duplicados, con fecha de inicio y monto valido
- no realizar peticiones al modificar filas hasta guardar

### Seguimiento ISS-08: horas y catálogo

`utils/weeklyHours` comparte la regla semanal entre Personal, Becario e Investigador
en alta/edición. Los inputs declaran mínimo 1, máximo 168 y paso 1; el submit
controlado impide valores vacíos, fraccionarios, no positivos o superiores a 168.
Los errores de horas devueltos por backend se muestran junto al campo y con foco.
Los datos anteriores no se corrigen automáticamente: al editar una carga inválida
se exige corregirla antes de guardar. No se reescriben historiales ni snapshots.

`useTiposPersonal` refresca al montar el formulario para reflejar altas y cambios
del catálogo; carga, fallo con reintento y catálogo vacío tienen feedback visible.
Un tipo anterior no disponible se muestra deshabilitado al editar, sin sustituir
su ID silenciosamente; para guardar debe seleccionarse un tipo disponible.

Pruebas: `weeklyHours.test.ts`, `personalCatalogForm.test.ts` (formulario real
con harness de hooks/JSX, no navegador), `personalAlta.test.ts` y
`formValidation.test.ts`. Comprobar manualmente en Docker altas/ediciones de las
tres clases, límites 168/169/220 y un tipo con nombre arbitrario del catálogo.
