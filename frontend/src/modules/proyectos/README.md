# Modulo frontend de proyectos

## Vistas

El modulo administra proyectos de investigacion y participaciones relevantes.
Los homes muestran hasta 9 elementos por pagina. Los detalles incluyen datos,
auditoria, historial paginado de 3 elementos, `Volver` y acciones condicionadas
por permisos y estado activo.

## Proyectos

- el service transforma el contrato `snake_case` del backend al modelo de interfaz
- el formulario valida campos obligatorios, coordinador y montos no negativos
- en edicion solo se envian diferencias reales
- altas y bajas de investigadores y becarios se consolidan al guardar
- los cambios de coordinador actualizan las relaciones involucradas en el guardado
- un proyecto cerrado no admite edicion hasta que sea reabierto
- las altas vuelven al home y las ediciones al detalle con `successMessage`

## Participaciones relevantes

- el service admite listas planas o envueltas en `data`
- el formulario valida investigador, evento, forma de participacion y fecha
- las ediciones sin diferencias no llaman al backend
- el historial y la auditoria se consumen desde el detalle

## Services, hooks y contratos

Los services concentran HTTP, conversion de datos y payloads tipados. Los hooks
encapsulan React Query e invalidan listas, detalles e historiales despues de cada
mutacion. No existen fallbacks mock ante errores: los fallos de permisos, sesion o
conectividad se propagan para mostrar feedback real y accionable.

## Seguridad y permisos

Las acciones de alta, cierre, reapertura, edicion y baja se condicionan con las
capacidades del usuario, sin considerar la interfaz como unica barrera. Los errores
se normalizan mediante el helper compartido y no se reflejan estructuras desconocidas
del servidor. No se utiliza HTML inyectado, storage del navegador ni `fetch` directo.
