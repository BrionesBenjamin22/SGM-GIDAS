---
id: ISS-75
title: Unificar el aspecto de la paginacion de Gestion de Catalogos
status: finished
area: frontend
module: catalogos
created_at: 2026-09-28
updated_at: 2026-09-28
closed_at: 2026-09-28
---

# Objetivo

Estandarizar los botones del paginador de valores de Gestion de Catalogos, observado en la seccion Becas, con el patron visual de los listados del sistema.

# Estado inicial

El listado del catalogo usa botones secundarios grandes y flechas de texto para anterior y siguiente, mientras la tabla compartida usa controles compactos con las etiquetas Anterior y Siguiente y numeros de pagina acordes. El historial por valor tiene una paginacion distinta y queda fuera del ajuste pedido.

# Criterios de aceptacion

- El paginador de valores conserva nueve items por pagina y sus cambios de pagina.
- Los controles visuales y estados activo/deshabilitado coinciden con el paginador de la tabla compartida.
- Se conservan nombres accesibles y la indicacion de pagina actual.
- La validacion tecnica pasa; la aceptacion visual y manual queda a cargo del usuario.

# Seguimiento 2026-09-28

- Archivo modificado: `frontend/src/modules/catalogos/pages/CatalogosHome.tsx`. El paginador de valores usa `TableActionButton` para Anterior y Siguiente y adopta la densidad, pagina activa y estados del paginador de `Table`.
- Se mantienen nueve valores por pagina, el numero de pagina actual mediante `aria-current` y los nombres accesibles de los controles.
- Validaciones tecnicas: 184/184 pruebas frontend, `npm run typecheck`, `npm run build:production` y `git diff --check` correctos.
- Validacion visual y manual del usuario aceptada expresamente el 2026-09-28.

# Cierre 2026-09-28

- Documentacion actualizada en `frontend/src/modules/catalogos/README.md` y `CHANGELOG.md` tras la aceptacion del usuario. No hubo cambios de contrato ni de backend.
- Estado de aceptacion: aprobado. Tarea cerrada por solicitud expresa de ejecutar el commit.
- Mensaje de commit: `style(catalogos): unificar botones de paginacion`.
