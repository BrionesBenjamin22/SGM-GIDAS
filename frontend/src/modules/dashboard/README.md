# Dashboard frontend

## Alcance

El home combina la configuracion institucional de la UCT con un resumen visual de
proyectos, personal y becarios. Consume UCT y directivos desde el modulo `grupo` y
las metricas mediante `useDashboardResumen`.

## Contrato

`dashboardGeneralService.ts` consulta `GET /dashboards/resumen` y tipa parametros,
indicadores totales, distribuciones, series anuales y alertas de proyectos.

Los filtros se construyen con `URLSearchParams`. `anios` debe ser un entero mayor a
cero y `fecha_desde` no puede superar `fecha_hasta`; el backend vuelve a validar
ambas reglas.

## Seguridad y permisos

La consulta requiere autenticacion y autorizacion del backend. La UI no usa las
visualizaciones como control de acceso ni expone detalles internos de errores.

La edicion de UCT se muestra a `ADMIN` y `GESTOR`; su eliminacion solo a `ADMIN`.
Los errores de carga y eliminacion se presentan con mensajes seguros y accionables.

## Visualizaciones y estados

Las series se transforman en elementos tipados `{ label, value }`. Los tooltips
aceptan solo etiquetas y valores escalares, sin renderizar HTML. Los estados de
carga, ausencia de configuracion y fallo se muestran por separado para no confundir
un error de red con una UCT inexistente.

## Feedback de acciones (seguimiento ISS-09)

Las acciones asíncronas del módulo usan Button con loading/loadingText
o ConfirmDialog, que espera la promesa devuelta por onConfirm. Durante la
operación se muestra texto de progreso con un icono animado, aria-busy y
role=status. El botón de acción se deshabilita hasta terminar; las
confirmaciones bloquean además cancelar, el fondo y los campos del diálogo.
El estado se libera al resolver o fallar, conservando errores y mensajes de
éxito existentes. Los callbacks basados en React Query deben devolver
mutateAsync para que el diálogo cubra toda la operación.
