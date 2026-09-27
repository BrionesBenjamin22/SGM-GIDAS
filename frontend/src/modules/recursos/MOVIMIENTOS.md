# Movimientos financieros: contrato frontend

## Vistas y rutas

`/movimientos` muestra el saldo disponible de la UCT activa, los totales de ingresos y egresos, y el historial en tabla. La columna Movimiento contiene solo el número; Tipo y Fuente son columnas separadas. La tabla permite buscar por número, fuente o categoría, filtrar por estado, tipo, fuente, categoría y fecha, y muestra hasta 9 registros por página. El historial de cambios de cada fila se carga al expandirla y se pagina de a 3 eventos.

El panel «Saldo por fuente de financiamiento» presenta ingresos, egresos y saldo disponible de cada fuente con movimientos activos. Tiene un selector para ver todas las fuentes o una en particular y pagina de a 3 tarjetas para conservar visible el historial. El selector y su paginación son independientes de los filtros de la tabla. No crea fuentes nuevas.

`/movimientos/nuevo` permite el alta; `/movimientos/:id` muestra los datos, Auditoría e Historial de cambios; `/movimientos/:id/editar` permite editar un registro activo. Las altas vuelven al listado y las ediciones al detalle con `successMessage`.

## Formulario y reglas

El formulario pide tipo, fecha, monto y fuente de financiamiento para todo movimiento. Un egreso también requiere categoría y puede vincular opcionalmente un equipamiento activo de la misma UCT. La lista de equipos disponibles excluye los vinculados a otro egreso e incluye el equipo propio durante la edición. Al seleccionar uno, el formulario toma su `monto_invertido` y propone la categoría `CAPITAL`, que el usuario puede cambiar. El monto queda de solo lectura mientras haya un equipo vinculado; para editarlo manualmente hay que desvincularlo. El importe del egreso se conserva como dato histórico si luego cambia el valor del equipo.

Número y moneda (`ARS`) se asignan automáticamente o se muestran como solo lectura. El tipo queda fijo en edición. Se envían solo diferencias reales y no se llama al backend si no hubo cambios. La validación local exige monto positivo, fecha válida, fuente y categoría cuando corresponde; los errores por campo provienen de `error.details.fields` y los fallos generales muestran un mensaje accionable.

Antes de guardar un egreso, el formulario consulta `GET /recursos/movimientos/grupos/<id>/saldos-por-fuente` y contrasta el monto con el saldo vigente de la fuente elegida. En edición reintegra el egreso anterior únicamente si mantiene esa fuente. Si no alcanza, impide el envío y abre el diálogo modal nativo `Saldo Insuficiente`, con foco en `Aceptar` y el saldo de esa fuente visible. Si el backend rechaza una operación concurrente, vuelve a consultar y muestra el saldo actualizado. El backend conserva la autoridad final.

## Servicios, hooks y permisos

`services/erogacionesServices.ts` concentra las consultas y mutaciones HTTP y sus tipos TypeScript. `hooks/useErogaciones.ts` consulta el historial de la UCT, `hooks/useSaldosPorFuente.ts` consulta el panel y `hooks/useCategoriasErogacion.ts` carga las categorías. `utils/movimientoHistory.ts` presenta importes, relaciones e historial; `utils/movimientoSaldo.ts` compara centavos sin pérdida de precisión. El formulario consulta los equipos disponibles mediante el service dedicado y actualiza las consultas afectadas tras guardar.

`ADMIN`, `GESTOR` y `LECTURA` ven listado y detalle; solo los dos primeros pueden crear, editar o eliminar. La baja es lógica y requiere confirmación. La navegación desde Búsqueda y Memorias usa `/movimientos/:id`; la portada pública no presenta el breadcrumb `Portada`.

El historial y el saldo se filtran por la UCT activa. Los datos ficticios se regeneran bajo esa UCT para que los resultados de Búsqueda también aparezcan en Finanzas. La etapa de USD y cotización manual queda pendiente de especificación final.
