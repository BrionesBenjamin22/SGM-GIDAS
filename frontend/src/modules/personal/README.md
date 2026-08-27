# Modulo frontend de personal

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

En edicion, investigador, becario, PTAA y profesional comparan el estado
normalizado con los datos iniciales y envian solo las diferencias reales. Si no
hay cambios no ejecutan el `PUT`, pero conservan la navegacion al detalle.

Las becas de un becario se editan localmente y se envian juntas en `becas` al
guardar. El frontend no desvincula ni vincula cada fila individualmente.

La seleccion de alta presenta cuatro categorias funcionales: Tecnico
administrativo y de apoyo, Personal Profesional, Becario e Investigador. `PTAA`
se conserva unicamente como identificador tecnico compatible con rutas y contratos
existentes; no se muestra como etiqueta al usuario.

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

- campos obligatorios y horas positivas
- fechas y tipos seleccionados
- becas sin duplicados, con fecha de inicio y monto valido
- no realizar peticiones al modificar filas hasta guardar
