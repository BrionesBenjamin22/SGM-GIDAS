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
de la entidad. Los errores de guardado se presentan dentro del formulario con
un mensaje accionable; no se utilizan alertas del navegador.
