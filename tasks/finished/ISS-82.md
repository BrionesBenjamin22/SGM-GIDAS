---
id: ISS-82
title: Administrar autores de documentación bibliográfica e incorporar su historial
status: finished
area: full-stack
module: produccion
priority: media
risk_level: medio
created_at: 2026-09-28
updated_at: 2026-09-29
closed_at: 2026-09-29
source: solicitud-usuario
owner: Codex
---

# Objetivo

Completar la administración de autores de documentación bibliográfica y hacer trazables sus cambios de nombre. Los autores de trabajos científicos quedan fuera de esta tarea.

# Estado actual

- El backend ya expone rutas CRUD para autores de documentación bibliográfica.
- La interfaz de Documentación permite listar y crear autores, pero no editarlos ni darlos de baja.
- La pantalla existente de Catálogos todavía no ofrece su administración ni un historial propio.

# Alcance y decisiones

- Incorporar la administración de estos autores a la pantalla existente de Catálogos, sin crear una ruta nueva. Mantener el alta de autores desde Documentación.
- Permitir editar el nombre y dar de baja al autor cuando no esté vinculado a una documentación activa. Las vinculaciones con documentaciones dadas de baja no bloquean el soft delete ni se eliminan físicamente. El backend rechaza la baja si existe una vinculación activa; la interfaz muestra un mensaje claro y accionable.
- Mostrar el historial de cambios de nombre del autor en Catálogos, con tres eventos por página, responsable, fecha y valores seguros. Registrar solo diferencias reales: guardar sin cambios no debe llamar al backend ni crear eventos.
- Reflejar las correcciones del nombre en las documentaciones activas que utilizan al autor. Conservar el nombre registrado en las versiones cerradas de Memorias.
- Atribuir los cambios del nombre al historial del autor. Atribuir las vinculaciones y desvinculaciones al historial de la documentación. No duplicar eventos entre historiales ni reconstruir eventos anteriores a esta funcionalidad.
- Respetar permisos por rol y aislamiento por UCT en la consulta y en las operaciones de escritura. Mantener auditoría y validación tanto en backend como en frontend.

# Criterios de aceptación

- Catálogos permite consultar, editar y dar de baja autores de documentación bibliográfica según permisos; Documentación conserva el alta y las relaciones existentes.
- No se pueden consultar ni modificar autores de otra UCT. Los endpoints protegen las operaciones aunque se invoquen directamente.
- Un cambio real de nombre produce un único evento en el historial del autor y actualiza su visualización en documentaciones activas. Una edición sin diferencias no envía cambios ni crea historial.
- La baja de un autor vinculado a una documentación activa se rechaza sin alterar sus datos ni relaciones. Si solo hay vínculos con documentaciones inactivas, se permite el soft delete del autor y se conservan esos vínculos y los nombres de las versiones cerradas.
- Las versiones cerradas de Memorias conservan el nombre que registraron al cerrarse.
- Vincular o desvincular un autor genera el evento correspondiente solo en el historial de la documentación; no aparece como cambio de nombre del autor.
- El historial del autor muestra tres eventos por página y estados de carga, vacío y error comprensibles. No se exige reconstruir historial previo.
- La visualización y el comportamiento se verifican manualmente, además de las pruebas técnicas del módulo.

# Validación prevista

- Pruebas backend de permisos, aislamiento por UCT, cambios reales, guardado sin cambios, baja con vínculos inactivos y baja bloqueada por vínculos activos.
- Pruebas de historial que comprueben la atribución de eventos y la ausencia de duplicados, junto con la conservación del nombre en versiones cerradas de Memorias.
- Revisión manual de Catálogos y Documentación: edición, baja, mensajes, paginación de tres eventos y actualización visible del nombre.

# Estado y seguimiento

- 2026-09-28: tarea creada; implementación diferida durante la validación de ISS-77.
- 2026-09-29: se fijaron alcance, reglas y criterios de aceptación para la implementación futura. Solo se actualizó este archivo; no se implementó la funcionalidad ni se ejecutaron pruebas de código.
- 2026-09-29: comenzó la implementación después de registrar ISS-86 para Memorias. Próximo paso: completar backend, frontend y pruebas técnicas; luego solicitar validación visual y funcional del usuario.
- 2026-09-29: se implementó auditoría, baja lógica, historial y filtro de activos para autores; las rutas alternativas de vinculación usan el historial de Documentación. Catálogos administra autores bibliográficos con validación del nombre, estados, edición, baja e historial de tres eventos por página. La creación desde Documentación y los nombres guardados en versiones cerradas de Memorias se conservan.
- Archivos modificados para ISS-82: `backend/modules/produccion/models/documentacion_autores.py`, `backend/modules/produccion/services/autores_service.py`, `backend/modules/produccion/controllers/autores_controller.py`, `backend/modules/produccion/routes/autores_rutas.py`, `backend/migrations/versions/d5a7e9c1b3f2_audit_bibliographic_authors.py`, `backend/tests/test_autores_bibliograficos_catalogo.py`, `backend/tests/test_autores_bibliograficos_migration.py` y `frontend/src/modules/catalogos/pages/CatalogosHome.tsx`.
- Validación técnica: 5 pruebas nuevas de autores, 1 prueba de migración y reversión en SQLite, 5 pruebas de historial de Documentación y Memorias, 21 pruebas de aislamiento UCT, 188 pruebas frontend, `npm run typecheck`, compilación Python y `git diff --check` correctos. La compilación de producción de Vite se interrumpió en este entorno; la ejecución directa de Vite informó acceso denegado al cargar `vite.config.ts`. La migración no se aplicó a una base de datos desplegada.
- Incidencias ajenas: había modificaciones preexistentes en otros módulos; no se incorporaron a ISS-82. El `.gitignore` local ignora `tasks/`, por lo que este seguimiento no aparece en `git status`.
- 2026-09-29: el usuario detectó errores 500 al listar y crear autores. Los logs del backend mostraron `ProgrammingError` y `flask db current` confirmó que la base de desarrollo seguía en `c3d5e7f9a1b2`. Se aplicó la migración `d5a7e9c1b3f2` mediante el servicio `migrate` de Docker Compose; la revisión quedó en `head`. El listado se ejecutó contra la base de desarrollo y una inserción temporal se verificó y revirtió en la misma transacción.
- 2026-09-29: se acotó el historial de Documentación a sus campos propios y a vinculaciones/desvinculaciones de autores. Los cambios de nombre y estado del autor permanecen en el historial de Catálogos. Archivos adicionales: `backend/modules/produccion/services/documentacion_service.py`, `frontend/src/modules/produccion/utils/documentacionHistory.ts`, `backend/tests/test_autores_bibliograficos_catalogo.py` y `frontend/tests/documentacionTable.test.ts`.
- Validación del seguimiento: 6 pruebas backend de autores, 5 de historial de Documentación y Memorias, 1 prueba frontend focalizada, `npm run typecheck` y `git diff --check` correctos. La compilación de producción en el contenedor frontend finalizó correctamente (`vite build`, 39,77 s). Sigue pendiente la comprobación visual y funcional del usuario.
- 2026-09-29: el usuario aclaró que un vínculo con una documentación dada de baja no debe bloquear el soft delete del autor. `AutorService.delete` ahora consulta solo documentaciones activas asociadas. Se ajustó el texto de confirmación en Catálogos. La prueba de regresión verifica baja permitida, conservación del vínculo histórico, auditoría y nombre de la versión cerrada; las 7 pruebas backend de autores, `npm run typecheck`, `git diff --check` y la compilación de producción en contenedor pasaron.
- 2026-09-29: el usuario aprobó la validación manual y solicitó actualizar la documentación y ejecutar los commits. Se actualizaron `backend/modules/produccion/README.md`, `frontend/src/modules/produccion/README.md`, `frontend/src/modules/catalogos/README.md` y `CHANGELOG.md`.
- Estado: finalizada tras la aceptación funcional y las validaciones técnicas registradas. Cambios listos para commits separados por módulo.
