---
id: ISS-41
title: Agregar breadcrumbs en todas las rutas del frontend
status: finished
area: frontend
module: transversal
priority: media
risk_level: bajo
created_at: 2026-09-26
updated_at: 2026-09-26
source: solicitud-usuario
owner: codex
blocked_by: []
accepted_at: 2026-09-26
closed_at: 2026-09-26
commit_sugerido:
  - "feat(navegacion): agregar breadcrumbs a las rutas internas"
  - "feat(auth): mostrar breadcrumbs en las pantallas publicas"
---

# Objetivo

Mostrar una ruta de navegacion accesible en todas las rutas del frontend. Los
enlaces deben apuntar a pantallas reales y conservar la proteccion de cambios sin
guardar de los formularios. Las etiquetas de detalle y version no muestran IDs.

# Estado inicial

- El router contiene rutas de tres y cuatro segmentos, principalmente ediciones,
  detalle de Personal y versiones de Memorias.
- No existe un breadcrumb en el frontend.
- El usuario autorizo insertar el componente en `AppLayout.tsx`, zona
  restringida por `AGENTS.md`, el 2026-09-26.
- Cambios preexistentes ajenos: `.gitignore` y dos modelos de backend en Recursos.

# Seguimiento 2026-09-26

- Cambios: se agrego un breadcrumb accesible para todas las rutas actuales con
  tres o mas segmentos. Los enlaces llevan a Inicio, al listado real y al detalle
  real; el ultimo elemento indica la pagina actual. Se conserva el estado de
  navegacion de Memorias sin retransmitir mensajes de exito.
- Archivos: `frontend/src/layouts/AppLayout.tsx`,
  `frontend/src/modules/shared/components/RouteBreadcrumbs.tsx`,
  `frontend/src/modules/shared/utils/routeBreadcrumbs.ts`,
  `frontend/tests/routeBreadcrumbs.test.ts`.
- Validaciones: 171 pruebas frontend aprobadas, `npm run typecheck` aprobado,
  `npm run build:production` aprobado y `git diff --check` sin errores. La prueba
  focalizada posterior cubre todas las rutas profundas declaradas en el router.
- Incidencias: `tasks/` esta ignorado por `.gitignore` preexistente; este archivo
  debe incorporarse expresamente cuando se solicite el commit. No se modificaron
  los cambios preexistentes ajenos.
- Estado de aceptacion: pendiente de validacion visual y funcional del usuario.

# Proximo paso

El usuario valida la apariencia, navegacion y bloqueo de salida con cambios sin
guardar en navegador. Tras su aprobacion y solicitud de cierre, actualizar
documentacion tecnica y `CHANGELOG.md`, cerrar esta tarea y proponer el mensaje
de commit. No ejecutar el commit sin solicitud expresa.

# Seguimiento 2026-09-26: ampliacion solicitada

- Solicitud: mostrar breadcrumbs en todas las rutas, incluidas pantallas publicas,
  listados, altas y detalles, y quitar los IDs de las etiquetas. La autorizacion
  del usuario se extendio a este alcance.
- Cambios: el mapa cubre todas las rutas declaradas en el router, sus redirecciones
  desembocan en la ruta canonica y la ruta comodin muestra `Pagina no encontrada`.
  Los nodos de detalle dicen `Detalle`; las versiones dicen `Version`. Los IDs
  permanecen en los enlaces, donde son necesarios para navegar.
- Archivos adicionales: `frontend/src/modules/auth/pages/Landing.tsx`,
  `frontend/src/modules/auth/pages/Login.tsx`,
  `frontend/src/modules/auth/pages/Register.tsx`.
- Validaciones: 172 pruebas frontend aprobadas; typecheck aprobado; build de
  produccion aprobado al ejecutarlo de forma aislada; `git diff --check` sin
  errores. El build paralelo con la suite fallo por acceso temporal a
  `vite.config.ts`, sin reproducirse al ejecutarlo solo.
- Estado de aceptacion: pendiente de validacion visual y funcional del usuario.
- Proximo paso: revisar en navegador Inicio, listado, alta, detalle, edicion,
  Memorias, portada, login, registro y proteccion de cambios sin guardar.
  No actualizar documentacion tecnica ni `CHANGELOG.md` hasta la aprobacion.

# Cierre 2026-09-26

- Aceptacion: el usuario aprobo expresamente los cambios y solicito actualizar
  la documentacion y ejecutar los commits.
- Documentacion final: `frontend/src/modules/README.md`,
  `frontend/src/modules/shared/README.md`,
  `frontend/src/modules/auth/README.md` y `CHANGELOG.md`.
- Validaciones finales: 172 pruebas frontend, typecheck, build de produccion
  aislado y `git diff --check` aprobados. No hubo cambios de backend.
- Estado: finalizada; se traslada a `tasks/finished/` y se agrega expresamente
  al staging porque `tasks/` esta ignorado por `.gitignore`.
