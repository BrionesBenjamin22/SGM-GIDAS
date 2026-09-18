---
id: ISS-19
title: Contextualizar errores de formularios y estructurar validaciones por campo
status: finished
area: cross-cutting
module: forms-error-contract
priority: alta
risk_level: alto
created_at: 2026-09-15
updated_at: 2026-09-18
closed_at: 2026-09-18
source: auditoria-posterior-ISS-17
owner: Codex
blocked_by: []
commit_sugerido: "fix(forms): contextualizar errores y asociarlos a campos"
related_tasks:
  - ISS-09
  - ISS-17
  - ISS-18
related_files:
  - frontend/src/modules/auth/pages/
  - frontend/src/modules/grupo/pages/
  - frontend/src/modules/personal/pages/
  - frontend/src/modules/produccion/pages/
  - frontend/src/modules/proyectos/pages/
  - frontend/src/modules/recursos/pages/
  - frontend/src/modules/transferencia/pages/
  - frontend/src/modules/memorias/
  - frontend/src/lib/httpError.ts
  - backend/modules/auth/
  - backend/modules/grupo/
  - backend/modules/personal/
  - backend/modules/produccion/
  - backend/modules/proyectos/
  - backend/modules/recursos/
  - backend/modules/transferencia/
  - backend/modules/memorias/
---

# Problema

La auditoria de formularios encontro que la mayoria usa un fallback accionable pero
generico, mientras que Visitas y Participaciones solo informan que la operacion no
pudo completarse sin indicar la accion siguiente. Siete formularios clasifican
errores buscando palabras dentro del texto recibido y pueden asociar un mensaje al
campo equivocado. Los errores de dominio sin `details.fields` dependen de esta
heuristica o terminan como avisos generales poco contextualizados.

ISS-18 debe resolver primero la no exposicion transversal de referencias internas.
ISS-19 completa la experiencia: cada error debe explicar la operacion afectada, el
dato que requiere correccion cuando se conoce y el siguiente paso posible.

# Objetivo

Generalizar un contrato de errores contextual, informativo, seguro y accionable en
todos los formularios, utilizando errores estructurados por campo y eliminando la
clasificacion basada en fragmentos de texto.

# Inventario inicial

## Formularios que deben revisarse

- Auth: `Register`, `CambiarPassword`, `UsuariosForm`.
- Grupo: `UctForm`, `VisitantesForm`, `PlanificacionesGrupoForm`.
- Personal: `PersonalForm` y sus variantes internas.
- Produccion: `DocenciaForm`, `ArticulosDivulgacionForm`, `DistincionesForm`,
  `DocumentacionForm`, `RegistrosPropiedadForm`, `TrabajosRevistasForm` y verificar
  que `TrabajosReunionForm` conserve la correccion de ISS-17.
- Proyectos: `ProyectosForm`, `ParticipacionesForm`.
- Recursos: `EquipamientoForm`, `ErogacionesForm`.
- Transferencia: `TransferenciasForm`.
- Memorias: `MemoriaForm`, `MemoriaPeriodoForm`.

## Formularios con heuristicas de texto

- `VisitantesForm`;
- `ParticipacionesForm`;
- `ArticulosDivulgacionForm`;
- `DistincionesForm`;
- `TrabajosRevistasForm`;
- `EquipamientoForm`;
- `ErogacionesForm`;
- `TrabajosReunionForm` debe migrarse si aun conserva la misma tecnica.

## Mensajes incompletos confirmados

- `No se pudo crear/actualizar la visita.`
- `No se pudo crear/actualizar la participacion.`

# Estados UX deseados

| Situacion | Presentacion esperada |
| --- | --- |
| Error local de validacion | Junto al campo, explica requisito y conserva el valor ingresado. |
| Error backend de campo | Junto al control correspondiente mediante `details.fields`. |
| Varios campos invalidos | Mensajes locales y foco en el primer control invalido en orden visual. |
| Error funcional general | Alerta o toast contextual con operacion, entidad y accion siguiente. |
| Conflicto | Explica la condicion funcional y que dato debe revisarse, sin revelar IDs. |
| Registro inexistente/inactivo | Informa que ya no esta disponible y ofrece volver o recargar segun el flujo. |
| Falla inesperada | Fallback seguro de carga, guardado o eliminacion; sin detalle tecnico. |
| Error de carga con reintento | Conserva datos utilizables si existen y ofrece `Reintentar`. |
| Guardado pendiente | Boton bloqueado, progreso visible y prevencion de doble envio. |
| Exito | Conserva mensajes y navegacion definidos por el proyecto. |

# Contrato objetivo

Para validaciones conocidas, el backend debe responder con codigo estable, mensaje
general publico y campos estructurados:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revise los campos indicados e intente nuevamente.",
    "details": {
      "fields": {
        "fecha_presentacion": "Ingrese una fecha valida.",
        "autores": "Agregue al menos un autor disponible."
      }
    }
  }
}
```

Reglas:

- claves de `fields` pertenecen al contrato HTTP, no al texto visible;
- valores de `fields` son oraciones publicas, declarativas y accionables;
- no incluir nombres de tablas, columnas, excepciones, endpoints, IDs internos,
  payloads, roles tecnicos o referencias de seguimiento;
- un error sin campo concreto permanece como mensaje general y no se fuerza dentro
  de un control;
- el frontend consume `applyFieldErrors` y no interpreta palabras del mensaje;
- campos desconocidos mantienen el aviso general y nunca se descartan en silencio.

# Tareas transversales

## 1. Definir catalogo de operaciones y tono

- Alta: `No pudimos crear <entidad>. Revise los campos indicados e intente nuevamente.`
- Edicion: `No pudimos actualizar <entidad>. Revise los campos indicados e intente nuevamente.`
- Carga: `No pudimos recuperar <entidad o datos>. Intente nuevamente.`
- Eliminacion: usar el texto base aprobado y contextualizar la entidad cuando aporte
  una accion concreta.
- Conflictos y relaciones: indicar la condicion funcional y la opcion de correccion.
- Mantener tildes, puntuacion y tratamiento institucional consistente.

## 2. Fortalecer el contrato backend

- Inventariar cada `ValidationError`, `ConflictError` y `NotFoundError` alcanzable
  desde los formularios.
- Agregar `details.fields` a errores que identifican un dato editable.
- Reemplazar mensajes con nombres internos como `user_id`, `grupo_utn_id` o nombres
  de payload por conceptos visibles en la interfaz.
- Mantener codigos HTTP, permisos, transacciones, rollback, auditoria y soft delete.
- No convertir errores inesperados en validaciones funcionales.
- Probar que un rechazo no persiste cambios parciales ni genera historial falso.

## 3. Simplificar el consumo frontend

- Usar `applyFieldErrors` con controles y aliases explicitos.
- Eliminar `lowerMessage.includes(...)` y equivalentes.
- Definir fallback por alta/edicion y entidad cuando corresponda.
- Mostrar aviso general solo si no se mapearon todos los errores de campo o si el
  error no tiene un campo asociado.
- Conservar borrador, foco, accesibilidad, bloqueo de doble envio y navegacion.
- Evitar nuevas abstracciones visuales globales; reutilizar la infraestructura
  existente de `Field`, alertas, toasts y botones.

# Ejecucion por modulo

Cada bloque debe actualizar frontend, backend, pruebas y README del modulo cuando
cambie el contrato. No iniciar otro bloque hasta que el anterior tenga pruebas
focalizadas correctas y diff revisado.

## 1. Auth

- `Register`, `CambiarPassword` y `UsuariosForm`.
- Validar credenciales, duplicados, permisos y generacion/copia de contrasena.
- Auth es zona restringida: obtener autorizacion explicita antes de modificarla.
- Commit sugerido: `fix(auth): contextualizar errores de formularios`.

## 2. Grupo

- `UctForm`, `VisitantesForm` y `PlanificacionesGrupoForm`.
- Corregir expresamente los mensajes incompletos de visitas.
- Validar autoridades, cargos, fechas, correo, UCT y anos de planificacion.
- Commit sugerido: `fix(grupo): estructurar errores de formularios`.

## 3. Personal

- `PersonalForm` y formularios internos de Personal, Investigador y Becario.
- Validar catalogos, horas, relaciones y registros inactivos.
- Commit sugerido: `fix(personal): contextualizar validaciones de formularios`.

## 4. Produccion

- Revisar los siete formularios del inventario y la regresion de reuniones.
- Reemplazar heuristicas en articulos, distinciones, revistas y reuniones.
- Validar fechas, autores, catalogos, enlaces y duplicados.
- Commit sugerido: `fix(produccion): estructurar errores de formularios`.

## 5. Proyectos

- `ProyectosForm` y `ParticipacionesForm`.
- Corregir expresamente los mensajes incompletos de participaciones.
- Validar coordinador, integrantes, fechas, codigo, fuentes y relaciones.
- Commit sugerido: `fix(proyectos): contextualizar errores de formularios`.

## 6. Recursos

- `EquipamientoForm` y `ErogacionesForm`.
- Reemplazar heuristicas y validar fechas, montos, tipos y fuentes.
- Commit sugerido: `fix(recursos): estructurar errores de formularios`.

## 7. Transferencia

- `TransferenciasForm`.
- Validar contrato, demandante, periodo, monto y relaciones.
- Commit sugerido: `fix(transferencia): contextualizar errores del formulario`.

## 8. Memorias

- `MemoriaForm` y `MemoriaPeriodoForm`.
- Validar UCT, solapamientos, periodos, estados y permisos.
- Commit sugerido: `fix(memorias): estructurar errores de formularios`.

# Pruebas requeridas por modulo

- alta valida y navegacion al home con `successMessage`;
- edicion valida y navegacion al detalle con `successMessage`;
- edicion sin cambios no llama al backend;
- error local enfoca el primer campo invalido;
- error backend con un campo y con multiples campos;
- campo backend desconocido conserva aviso general;
- conflicto funcional muestra mensaje contextual sin IDs;
- 403/404/409/422 o codigos usados por el modulo muestran fallback seguro;
- 500, respuesta de texto y cuerpo malformado no exponen detalles;
- doble envio bloqueado y borrador conservado tras el error;
- relaciones se consolidan y un rechazo realiza rollback completo;
- accesibilidad de `role="alert"`, `aria-live`, foco y botones;
- permisos ADMIN/GESTOR/LECTURA segun el contrato de cada modulo.

# Validacion final transversal

Frontend:

```text
npm test
npm run typecheck
npm run build:production
```

Backend:

- pruebas focalizadas de cada modulo modificado;
- pruebas de respuestas API y excepciones de dominio;
- suite completa al finalizar todos los bloques;
- prueba en Docker/PostgreSQL para transacciones, constraints y rollback.

Manual:

- probar al menos alta, edicion, conflicto y error inesperado por modulo;
- comprobar mensajes junto al campo y avisos generales sin duplicados;
- comprobar teclado, foco, lectores de pantalla basicos y responsive cuando el
  mensaje cambie la composicion;
- revisar consola y red para confirmar que la UI no vuelca detalles del servidor;
- verificar navegacion y mensajes de exito sin regresiones.

Calidad:

- `git diff --check` por bloque;
- revision de cambios preexistentes y staging por modulo;
- documentacion frontend/backend actualizada;
- CHANGELOG actualizado al cerrar cada bloque o el issue segun el alcance acordado.

# Criterios de aceptacion

- Todos los formularios tienen fallbacks contextuales y accionables.
- Visitas y Participaciones explican como continuar despues del fallo.
- No quedan heuristicas basadas en palabras del mensaje para asignar campos.
- Las validaciones conocidas usan `details.fields` y enfocan el control correcto.
- Los errores desconocidos nunca se descartan ni exponen detalles tecnicos.
- No se muestran IDs internos, nombres de infraestructura ni referencias de seguimiento.
- Se conservan permisos, transacciones, auditoria, soft delete y navegacion.
- Cada modulo tiene pruebas y documentacion consistentes con su contrato.
- La prueba completa frontend/backend y la validacion manual quedan registradas.

# Estados de la tarea

- `pending`: bloqueada por ISS-18; documentos aprobados, sin implementacion.
- `in-progress`: contrato base congelado y al menos un modulo en desarrollo.
- `pending-manual-verification`: todos los bloques y pruebas automaticas correctos;
  resta la matriz manual transversal.
- `finished`: matriz manual aceptada, documentacion y CHANGELOG completos, sin
  formularios pendientes ni incidencias sin registrar.

Cada seguimiento debe agregarse en este mismo archivo con fecha, modulo, archivos,
validaciones, incidencias y aceptacion. No crear sufijos por bloque.

# Fuera de alcance

- Redisenar formularios o cambiar layout, router y estilos base.
- Modificar permisos o reglas de negocio no relacionadas con el mensaje observado.
- Eliminar metadata operativa del backend; ISS-18 define su separacion de la UI.
- Crear una libreria nueva de formularios o reemplazar TanStack Query.
- Ejecutar commits automaticamente sin solicitud del usuario.

## Seguimiento 2026-09-16

- Estado: en curso. ISS-18 está finalizada. El usuario autorizó expresamente los cambios en Auth, aún no iniciados.
- Grupo/Visitas y Proyectos/Participaciones: se añadieron errores de backend con `details.fields` para validaciones conocidas, mensajes generales accionables, aliases HTTP en frontend y se eliminó la asignación de campos por palabras del mensaje. Se añadieron pruebas focalizadas y documentación frontend/backend.
- Producción/Recursos: se retiraron las heurísticas de texto de seis formularios (artículos, distinciones, reuniones, revistas, equipamiento y erogaciones). El backend y las pruebas por módulo siguen pendientes. Se documentó el estado parcial en los README frontend.
- Archivos modificados: `backend/modules/grupo/services/visita_service.py`, `backend/modules/proyectos/services/participacion_relevante_service.py`, sus dos pruebas y README frontend/backend; `frontend/src/lib/httpError.ts`, `frontend/tests/httpError.test.ts`, `VisitantesForm.tsx`, `ParticipacionesForm.tsx` y los seis formularios de Producción/Recursos enumerados arriba.
- Validaciones: frontend `npm test` 105/105, `npm run typecheck` correcto, `npm run build:production` correcto fuera del sandbox, `git diff --check` correcto, `python -m compileall` correcto para archivos Python modificados. En Docker, con `import app` para registrar modelos, pasaron 12 pruebas de Visitas/Participaciones y 7 de errores de dominio de Grupo/Proyectos.
- Incidencia de entorno: `backend/venv` apunta a un Python inexistente y el Python disponible no tiene `flask_sqlalchemy`; se utilizó el contenedor backend activo para las pruebas. La ejecución aislada de las pruebas de historial sin cargar `app` falla por la relación SQLAlchemy con `Usuario`, una dependencia de inicialización preexistente. La validación manual y las pruebas de transacciones reales en PostgreSQL siguen pendientes.
- Próximo paso: revisar el diff del bloque, completar el contrato backend y pruebas de Producción/Recursos; seguir con Auth, Personal, Transferencia y Memorias; ejecutar pruebas backend y matriz manual en un entorno operativo. No cerrar ISS-19 ni actualizar CHANGELOG hasta completar todos los bloques.

## Seguimiento 2026-09-17

- Estado: en curso. La autorización previa del usuario para Auth se aplicó a Register, CambiarPassword y su service. No se ejecutó ningún commit.
- Contrato: se añadieron errores de campo y fallbacks en Auth, Grupo, Personal, Producción, Proyectos, Recursos, Transferencia y Memorias. `responses.error_response` ya no infiere campos desde texto; solo transmite `details.fields` explícitos. `httpError.ts` mapea aliases y conserva aviso general si hay campos desconocidos.
- Archivos modificados: services y README de `backend/modules/auth`, `grupo`, `memorias`, `personal`, `produccion`, `proyectos`, `recursos` y `transferencia`; `backend/modules/shared/controllers/responses.py`, `backend/modules/shared/services/error_messages.py`; formularios y README de esos módulos en `frontend/src/modules`, `frontend/src/lib/httpError.ts`; pruebas de dominio, memoria, respuestas y búsqueda en `backend/tests` y `frontend/tests/httpError.test.ts`.
- Validaciones: frontend `npm test` 107/107, `npm run typecheck` y `npm run build:production` correctos. Backend: pruebas focalizadas de los módulos correctas; `test_error_handlers` y `test_memoria_periodos_uct` 15/15; Proyectos 26/26; respuestas y búsqueda 16/16. La suite completa en el contenedor ejecutó 431 pruebas: tres errores por archivos de configuración del repositorio no montados en `/app` y tres aserciones desactualizadas (dos de `details`, una de acentuación). Se actualizaron esas aserciones y pasaron sus pruebas; las tres pruebas de despliegue pasaron en el host. `git diff --check` correcto tras corregir finales de archivo.
- Pendiente: auditar autoridades de Grupo y relaciones de Becarios/Investigadores, autores y adoptantes para completar errores de campo alcanzables; realizar matriz manual de alta, edición, conflicto y error inesperado por módulo, foco y accesibilidad, rollback en PostgreSQL y revisión final del diff. Mantener ISS-19 en `in-progress` y no actualizar `CHANGELOG.md` hasta el cierre.
- Continuación del bloque: `backend/modules/grupo/services/directivo_service.py`, `backend/modules/personal/services/investigador_service.py`, `becario_service.py` y `backend/modules/produccion/services/trabajo_autores_service.py` recibieron campos explícitos; se ampliaron sus README y pruebas. `test_directivo_cargos` 9/9, `test_personal_domain_errors` 11/11 y `test_trabajo_autores` 11/11. La creación de un directivo y su asignación aún usan dos solicitudes y pueden dejar un directivo sin asignar si falla la segunda; requiere una operación transaccional antes de dar por aceptada la matriz de rollback.
- Corrección posterior: se agregó POST `/api/v1/grupo/directivos/crear-y-asignar` y el hook del formulario usa un solo POST transaccional. Su prueba SQLite confirma que un cargo inválido revierte la creación; la prueba de permisos confirma GESTOR 201 y LECTURA 403 (`test_directivo_cargos` 11/11). A pedido del usuario se retiró la invalidación automática de la consulta de directivos tras las mutaciones del formulario: editar campos o guardar no dispara otra carga. Una nueva entrada al formulario consulta datos actuales. El formulario conserva el slot ya creado si falla la segunda autoridad para no repetir el alta al reintentar. Frontend `npm test` 107/107, `npm run typecheck` correcto y `git diff --check` correcto.
- Ajuste UX posterior: `UctForm.tsx` asocia errores del directivo al slot correspondiente (`nombre1/2`, `cargo1/2`, `fecha1/2`), preserva los datos y evita repetir un alta completada durante un reintento. Proyectos, Personal, Producción y Memorias recibieron fallbacks concretos por operación; Proyectos no duplica aviso cuando todos los errores de campo están mapeados. Se actualizó la prueba de coordinador para ese contrato. Frontend `npm test` 107/107 y TypeScript correctos.
- Protección adicional solicitada: `UctForm.tsx` deshabilita la consulta de directivos desde que comienza el guardado para que la invalidación de UCT no habilite una nueva carga durante el formulario. `useDirectivos.ts` admite esa compuerta y no invalida su consulta tras mutaciones. La prueba de flujo UCT refleja el nuevo contrato; frontend `npm test` 107/107 y `npm run typecheck` correctos.
- Transferencia: la relación de adoptantes expone `adoptantes_ids` y el formulario muestra el mensaje junto al selector sin modificar el componente global restringido. `test_transferencia_domain_errors` 5/5, TypeScript y `git diff --check` correctos. La creación inline de adoptantes en el componente global sigue pendiente de autorización específica si se decide modificar ese control.
- Validación transversal posterior: frontend `npm test` 107/107, `npm run typecheck` y `npm run build:production` correctos. Backend completo en Docker: 438 pruebas ejecutadas, solo 3 errores de `test_https_deployment_template` porque el contenedor monta `backend/` en `/app` y no dispone de archivos del raíz (`nginx/` y `.env.production.example`); esas 3 pruebas pasan ejecutadas desde el host. No se detectaron fallos funcionales en las otras 435 pruebas.
- Autorización nueva del usuario: se permite modificar `frontend/src/components/AdoptanteSelector.tsx`. El alta inline ahora muestra el error estructurado de `nombre` junto al control, conserva el texto, enfoca y mantiene el aviso general para errores sin campo. Se añadió prueba de interacción `frontend/tests/adoptanteSelectorErrors.test.ts`; frontend 108/108, TypeScript correcto. `AdoptanteService` expone `nombre` en validaciones y conflicto; `test_transferencia_domain_errors` 6/6.
- Becarios: fechas, montos y selección de becas devuelven `details.fields.becas`, mapeado a `becaGlobal`. Se añadió prueba focalizada; `test_personal_domain_errors` 12/12. El primer intento de esa prueba falló por ausencia de contexto Flask en el test y se corrigió con contexto y mock de consulta. Sigue pendiente la matriz manual final; no cerrar ni actualizar CHANGELOG.
- Revisión final 2026-09-17: `npm test` 108/108, `npm run typecheck`, `npm run build:production` y `git diff --check` correctos. Las pruebas focalizadas de relaciones de Personal y Transferencia pasaron 8/8 tras actualizar una aserción que esperaba el antiguo texto técnico de becas repetidas. La suite backend completa previa pasó 435 pruebas funcionales; las 3 pruebas de plantilla HTTPS fallan solo por el montaje parcial de Docker y pasan en el host. Queda la matriz manual para aceptación y verificar el flujo completo en PostgreSQL.

## Seguimiento 2026-09-17: nombres y sesión

- A pedido del usuario se auditó la entrada de nombres descriptivos. Se exige al menos una letra Unicode en nombres de Personal, Investigador, Becario, directivos, autores, adoptantes, proyectos, eventos, revistas, reuniones, artículo de propiedad, grupo/UCT, equipamiento y transferencia. Los códigos, ISSN, IDs, fechas, montos y nombres de usuario mantienen sus contratos propios. Se validan en frontend y backend, con `details.fields` para los errores de servidor. Los catálogos heterogéneos no recibieron una regla global porque algunos admiten valores numéricos.
- Se detectó una causa reproducible de pérdida prematura de sesión: cambiar la contraseña revocaba el refresh token sin entregar uno nuevo al navegador. El endpoint ahora emite tokens y cookie nuevos; AuthContext actualiza usuario, access token y tiempos. Si una sesión activa no se puede restaurar después de recargar, Login explica que terminó y pide ingresar de nuevo. La causa concreta del 401 observado por el usuario no pudo confirmarse sin registro de esa solicitud; el aviso anticipado actual responde al vencimiento renovable de siete días, no al access token de quince minutos.
- Validaciones: frontend `npm test` 110/110, `npm run typecheck` y `npm run build:production` correctos; backend focalizado de nombres, proyectos y Auth correcto. La suite backend completa ejecutó 443 pruebas: una regresión de orden de validación del código de proyecto se corrigió y sus 6 pruebas focalizadas pasaron; los tres errores restantes corresponden a archivos raíz ausentes dentro del montaje Docker, como se registró antes. `git diff --check` correcto. Queda la matriz manual del usuario, incluida la recarga tras cambio de contraseña y una sesión vencida/revocada, y verificar el flujo transaccional en PostgreSQL. ISS-19 sigue en curso; no se ejecutó commit ni se actualizó CHANGELOG.
- La prueba adicional de Auth confirma que el refresh anterior queda revocado tras cambiar la contraseña y el nuevo token sí se puede renovar; `test_auth_refresh_tokens` y `test_auth_cookie_contract` pasaron 20/20.

## Seguimiento 2026-09-17: solo letras en nombres de personas

- Por precisión del usuario, Personal, Investigador, Becario, directivos, autores y adoptantes admiten únicamente letras Unicode y espacios entre palabras. Se rechazan dígitos, guiones, apóstrofes y otros signos en alta y edición. El backend devuelve `details.fields` y el frontend muestra el error antes de enviar. La edición de adoptantes tenía una ruta de validación independiente y también se cubrió.
- Los nombres de proyectos, eventos, revistas, reuniones, UCT, equipamiento y transferencias conservan la regla de contener al menos una letra. Esta corrección no cambia consultas de directivos ni activa solicitudes nuevas.
- Validaciones: backend focalizado de nombres, Personal, directivos, Transferencia y autores 43/43; frontend `npm test` 111/111, TypeScript, build de producción y `git diff --check` correctos. Sigue pendiente la comprobación manual del usuario; la tarea no se cierra ni se ejecuta commit.

## Seguimiento 2026-09-17: módulo servido desactualizado en desarrollo

- Durante la prueba manual de `/transferencias/nuevo`, el navegador recibió de Vite una versión anterior de `textValidation.ts` que solo exportaba `hasLetter`, aunque el archivo montado en `/app/src/lib/textValidation.ts` ya exportaba `hasOnlyLettersAndSpaces`. Eso impedía cargar `AdoptanteSelector` y mostraba el error predeterminado del router.
- Se reinició solo el contenedor frontend de desarrollo. Se comprobó por HTTP que tanto `localhost:5173` como el proxy `localhost:80` sirven el módulo actualizado con ambos exports y `Cache-Control: no-cache`, y que `AdoptanteSelector.tsx` importa el export disponible. Frontend `npm test` 111/111. El usuario debe recargar la ruta y repetir el alta de adoptante; ISS-19 sigue pendiente de su prueba manual. No se modificó el router ni se ejecutó commit.

## Seguimiento 2026-09-17: borrador de erogaciones y edicion de fechas

- El usuario confirmo la validacion manual de los comportamientos anteriores, incluida la finalizacion de sesion al eliminar la cookie, e informo dos incidencias nuevas: el borrador de Erogaciones no sobrevivia a la recarga y el calendario no dejaba editar dia, mes o anio por separado. Autorizo expresamente modificar `frontend/src/components/Calendar.tsx`.
- `ErogacionesForm.tsx` usa el borrador local compartido, aislado por usuario y registro. Ofrece restaurar o descartar despues de volver a ingresar, y lo elimina al guardar correctamente. `Calendar.tsx` conserva los separadores cuando se modifica un segmento y permite sobrescribir digitos en fechas completas; el parseo y los limites de fecha siguen vigentes. Se documento el comportamiento en `frontend/src/modules/recursos/README.md`.
- Archivos nuevos: `frontend/src/utils/dateInput.ts` y `frontend/tests/dateInput.test.ts`. Validaciones: frontend `npm test` 114/114, `npm run typecheck`, `npm run build:production` y `git diff --check` correctos.
- Estado: ISS-19 sigue en curso hasta comprobar manualmente la recuperacion del borrador tras recargar sin cookie y la edicion por segmentos en los campos de fecha. No se ejecuto commit ni se actualizo `CHANGELOG.md`.

## Seguimiento 2026-09-17: correccion de calendario y edicion de erogaciones

- El usuario detecto que la mascara omitía la segunda barra (`01/022022`) y que la edicion de Erogaciones bloqueaba la fecha. La causa de la barra fue conservar toda cadena con una barra sin completar el siguiente separador. Se corrigio `frontend/src/utils/dateInput.ts` y `Calendar.tsx` restaura la posicion del cursor tras normalizar. La prueba recorre la escritura digito por digito de `01022022` y exige `01/02/2022`.
- El backend de Erogaciones acepta cambios parciales de numero, tipo, fuente, fecha e importes. Valida numero unico en el grupo, catalogos disponibles y fecha dentro del rango; registra cada diferencia en auditoria. Frontend habilita esos controles, envia solo diferencias y actualiza su contrato tipado. Se actualizaron los README de Recursos.
- Validaciones: frontend 114/114, TypeScript y build de produccion correctos; backend focalizado 15/15 con modelos registrados. La primera corrida aislada del test backend fallo por el registro incompleto de modelos SQLAlchemy (`Usuario`), una dependencia de inicializacion ya conocida; al cargar `app` pasaron las pruebas. `git diff --check` correcto.
- Vite servia una version anterior de `dateInput.ts`; se reinicio solo `gidas_frontend` y se verifico por HTTP 200 que `dateInput.ts`, `Calendar.tsx` y `ErogacionesForm.tsx` ya incluyen los cambios. Falta la comprobacion manual de escritura y correccion de fecha en el navegador. ISS-19 sigue en curso; no se ejecuto commit.

## Cierre 2026-09-18

- El usuario confirmo la validacion manual de nombres, sesion, fechas, erogaciones y formularios. Las incidencias de borradores se resolvieron y validaron en ISS-22; Transferencias se corrigio en ISS-24.
- La suite frontend final de esta etapa paso 114/114 pruebas, `typecheck` y build de produccion. Las pruebas backend focalizadas de contratos y relaciones pasaron.
- Se comprobo el rollback real de la creacion y asignacion de directivos en PostgreSQL: un cargo invalido deja cero directivos con el nombre de prueba.
- La suite backend completa ejecuto 455 pruebas: 452 correctas y 3 errores de plantilla HTTPS por archivos de la raiz ausentes del montaje Docker. Esas 3 pruebas pasaron desde el host. Se actualizo el inventario de blueprints para incluir `form_draft` y su prueba focalizada paso 10/10.
- El codigo de ISS-19 ya esta en commits por modulo anteriores a este cierre. `CHANGELOG.md` registra el resultado y la limitacion del montaje Docker.
