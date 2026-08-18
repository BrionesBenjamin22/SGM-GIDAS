# Transferencia frontend

## Alcance

El modulo administra transferencias socio-productivas, sus adoptantes y los tipos
de contrato. Incluye home, alta, edicion, detalle, auditoria e historial de cambios.

## Vistas y navegacion

- `TransferenciasHome` lista hasta 9 registros por pagina, filtra activos e inactivos
  y permite la baja logica segun los permisos del usuario.
- `TransferenciasForm` valida los datos, consolida altas y bajas de adoptantes y en
  edicion envia solo diferencias reales. Un alta vuelve al home y una edicion al
  detalle, siempre con `successMessage`.
- `TransferenciasDetalle` presenta datos, auditoria e historial. El componente de
  historial pagina 3 eventos y contempla cambios de campos y relaciones.

## Services y contratos

- `transferenciasServices.ts` adapta el contrato snake_case del backend al modelo
  TypeScript de la UI. Las relaciones usan `adoptantes_ids` en operaciones POST y
  DELETE sobre `/transferencias/:id/adoptantes`.
- `adoptantesServices.ts` consume el CRUD del backend, incluida la baja logica con
  `DELETE /adoptantes/:id`.
- `tiposContratoService.ts` obtiene el catalogo desde `/tipo-contrato/`.
- `useTransferencias.ts` y `useAdoptantes.ts` encapsulan consultas, mutaciones e
  invalidacion de cache.

Las respuestas de listas e historiales admiten tanto arreglos planos como envoltorios
`{ data }`, sin recurrir a `any`. Los errores se interpretan con el helper seguro
compartido y se muestran con mensajes accionables sin exponer detalles internos.

## Validaciones y relaciones

- Numero de transferencia entero y positivo.
- Denominacion y demandante con al menos 3 caracteres luego de recortar espacios.
- Descripcion con al menos 10 caracteres.
- Monto finito y mayor que cero.
- Fecha de inicio obligatoria y fecha final no anterior.
- Tipo de contrato y grupo UTN obligatorios.
- Las altas y bajas de adoptantes se calculan antes de guardar y no se persisten al
  seleccionar o quitar elementos del formulario.

## Permisos y seguridad

La UI respeta los permisos de creacion, edicion y eliminacion provistos por auth; el
backend sigue siendo la autoridad final y protege los endpoints por rol. Las bajas
son logicas y quedan auditadas. El detalle oculta la edicion de registros inactivos.

El mock de transferencia solo se habilita en desarrollo cuando
`VITE_ENABLE_TRANSFERENCIA_MOCK=true`. Los datos de `localStorage` se parsean de
forma defensiva y nunca se usan como fallback automatico por falta de configuracion
de API ni en builds de produccion.
