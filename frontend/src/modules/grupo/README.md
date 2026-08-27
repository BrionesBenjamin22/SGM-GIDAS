# Modulo frontend de grupo

## Vistas

El modulo contiene configuracion de UCT, directivos, programas,
planificaciones y visitas. Sus homes usan hasta 9 elementos por pagina y sus
detalles consumen auditoria e historial cuando existe endpoint.

## Planificaciones

- el home solicita `page` y `per_page=9` al backend
- el formulario envia solo diferencias reales en edicion
- el detalle muestra datos, auditoria, historial paginado de 3 elementos,
  `Volver` y `Editar` segun estado y permisos
- alta vuelve al home; edicion vuelve al detalle con `successMessage`
- los errores de carga, guardado y eliminacion usan mensajes seguros y visibles

## UCT y exportacion

- el contrato de la UCT se transforma desde los nombres del backend en el service
- las actualizaciones envian solo campos modificados
- las altas, cambios y finalizaciones de directivos se consolidan antes de guardar
- la exportacion valida que la respuesta no este vacia y que su tipo sea compatible
  con Excel; los errores del servidor se normalizan antes de mostrarse

## Visitas academicas

- el service admite listas planas o envueltas en `data` y expone tipos dedicados
- el formulario valida razon, fecha, procedencia y tipo de visita
- en edicion solo se envian diferencias reales; si no existen, no se llama al backend
- el alta vuelve al home y la edicion al detalle con `successMessage`
- el detalle consume auditoria e historial con paginas de 3 elementos

## Directivos

Las altas faltantes, cambios de nombre y finalizaciones se preparan en el
formulario de UCT. Editar una fila no persiste inmediatamente: el usuario debe
guardar la UCT para aplicar los cambios pendientes. La pantalla informa cuando
existen operaciones sin guardar.

## Services, hooks y tipos

- los services centralizan HTTP y contratos TypeScript
- los hooks encapsulan React Query e invalidacion por dominio
- las pages conservan estado local y validaciones de formulario
- no deben existir llamadas `fetch` o `axios` directas fuera de services

## Permisos y errores

Los botones se condicionan con las capacidades del usuario y el estado activo
de la entidad. Los errores de carga, guardado, eliminacion y exportacion usan el
normalizador compartido y mensajes accionables; no se reflejan estructuras
desconocidas del servidor ni se utilizan alertas del navegador.
