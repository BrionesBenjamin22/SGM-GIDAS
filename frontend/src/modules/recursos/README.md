# Recursos

## Funcionalidad

El modulo administra equipamiento e infraestructura y el resumen de ingresos y
egresos. Cada entidad dispone de home, formulario, detalle, auditoria e historial.
Los homes muestran hasta 9 elementos y los historiales 3 items por pagina.

## Servicios y contratos

Los services normalizan contratos planos y respuestas envueltas en `{ data }` sin
usar `any`. Equipamiento, erogaciones, payloads, catalogos e historiales mantienen
tipos explicitos. Las llamadas HTTP se concentran en services dedicados.

## Formularios y navegacion

- Las altas vuelven al home con `successMessage`.
- Las ediciones vuelven al detalle y envian solo diferencias reales.
- Equipamiento valida denominacion, descripcion, fecha y monto positivo finito.
- Erogaciones valida numero entero positivo, catalogos, fecha e importes finitos no
  negativos; ingresos y egresos no pueden ser ambos cero.
- En edicion de erogaciones solo se envian ingresos y egresos, conforme al backend.

## Seguridad, permisos y errores

Los errores se procesan con `getErrorMessage`, admitiendo el contrato tipado del
backend sin reflejar cuerpos desconocidos. Las operaciones fallidas muestran un
fallback accionable. Los permisos visuales complementan los controles del backend.

El modulo no usa `any`, HTML no confiable, storage, secretos ni `fetch` directo.
React renderiza los datos como texto y los payloads se construyen con campos
permitidos explicitamente.

## Validacion tecnica

El cierre del modulo requiere auditoria estatica focalizada, pruebas unitarias
compartidas, `npm run typecheck` y `npm run build`.
