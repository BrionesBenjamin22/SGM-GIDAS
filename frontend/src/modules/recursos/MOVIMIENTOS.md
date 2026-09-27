# Movimientos financieros: contrato frontend

## Vistas y rutas

`/movimientos` muestra el saldo disponible de la UCT activa y un historial en tabla con ingresos, egresos, fuente o categoría, importe, estado, filtros y acciones por fila. El listado pagina de a 9 registros y expande el historial de cambios de a 3. `/movimientos/nuevo` permite el alta; `/movimientos/:id` muestra datos, Auditoría e Historial de cambios; `/movimientos/:id/editar` permite editar un registro activo. Las altas vuelven al listado y las ediciones al detalle con `successMessage`.

El formulario pide tipo, fecha, monto y la relación condicional: fuente para ingreso o categoría para egreso. Número y moneda (`ARS`) son de solo lectura o asignación automática; el tipo queda fijo en edición. Se envían solo diferencias reales y no se llama al backend si no hubo cambios. Las consultas y mutaciones viven en `services/erogacionesServices.ts`, con tipos TypeScript explícitos. `hooks/useErogaciones.ts` consulta el historial del grupo, `hooks/useCategoriasErogacion.ts` carga categorías y `utils/movimientoHistory.ts` presenta importes e historial. `utils/movimientoSaldo.ts` compara centavos sin pérdida de precisión.

Antes de guardar un egreso, el formulario consulta `GET /recursos/movimientos/grupos/<id>/resumen` y contrasta el monto con el saldo vigente. En edición suma el egreso previo al saldo para evaluar el monto nuevo. Si no alcanza, impide el envío y abre un diálogo modal nativo `Saldo Insuficiente`, con foco en `Aceptar` y saldo disponible visible. Si el backend rechaza una operación concurrente, vuelve a consultar y muestra el saldo actualizado. El backend conserva la autoridad final. Mientras consulta el saldo, el botón informa progreso y evita envíos repetidos.

`ADMIN`, `GESTOR` y `LECTURA` ven listado y detalle; solo los dos primeros ven acciones de alta y edición. Los errores por campo usan `error.details.fields`; los de carga y guardado ofrecen mensajes accionables. La baja lógica se confirma y presenta resultado visible. La navegación desde Búsqueda y Memorias usa `/movimientos/:id`; la portada pública del sistema no presenta el breadcrumb `Portada`.

El historial se filtra por la UCT activa, igual que el saldo. Los datos ficticios del entorno se regeneran bajo esa UCT para que los resultados de Búsqueda aparezcan también en Finanzas. La etapa de USD y cotización manual queda pendiente de especificación final.
