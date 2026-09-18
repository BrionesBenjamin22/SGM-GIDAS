---
id: ISS-22
title: Persistir borradores de formularios en backend
status: finished
area: cross-cutting
module: form-drafts
priority: alta
risk_level: alto
created_at: 2026-09-17
updated_at: 2026-09-17
owner: Codex
related_tasks:
  - ISS-19
---

# Objetivo

Guardar un único borrador vigente por usuario, formulario y registro en backend.
Al salir de un formulario con cambios, preguntar si se guarda, descarta o sigue
editando. Mostrar una lista de los borradores del usuario autenticado, con fecha y
destino, sin exponer el contenido en la lista.

# Seguridad y política

- No guardar contenido de formularios, credenciales ni datos personales en
  `localStorage` o `sessionStorage`.
- Excluir formularios de contraseñas y credenciales.
- Rechazar claves sensibles en cualquier nivel del payload, limitar tamaño y
  profundidad, y no registrar el cuerpo en logs.
- Autorizar lectura, escritura y eliminación por usuario; los permisos de la
  entidad vuelven a comprobarse al abrir el formulario.
- Vencer borradores a los siete días. El éxito y el descarte los eliminan.
- Si se pierde la sesión, solo se recupera la última versión confirmada por el
  servidor; indicar el estado de guardado en la interfaz.
- Una edición debe advertir si el registro cambió desde el borrador.

# Estado

Autorizadas por el usuario las modificaciones del hook compartido y layout/router.
ISS-19 fue distribuida en commits por módulo. También se autorizaron
`DraftRecoveryNotice` y el nuevo `DraftLeaveControls`. La implementación cubre
los formularios de alta y edición del router principal para grupo, personal,
proyectos, recursos, transferencia, memorias y producción. Los formularios de
usuarios y contraseñas quedan excluidos porque manejan credenciales.

Se agregó persistencia en `form_draft`, migración `a1d7c9e2f4b6`, endpoints
autenticados, lista de borradores, confirmación de salida y recuperación por
formulario. Se retira el almacenamiento heredado del navegador al iniciar la
aplicación. Los formularios de personal conservan sus tres implementaciones;
el enlace de recuperación incluye la clase de registro.

Validaciones automáticas del 2026-09-17: 110/110 pruebas frontend, `typecheck`,
build de producción, 5/5 pruebas backend de borradores y `git diff --check`.
El contrato de frontend prueba el reemplazo de la última versión; una huella
versionada de los valores originales advierte si cambió una edición antes de
recuperar el borrador. Se verificó que la carga inicial de una edición no
dispare un guardado automático.
La migración está en `head` en Docker de desarrollo. Los servicios frontend y
backend están montados desde el workspace y aparecen activos. No se ejecutaron
commits de ISS-22: el usuario pidió hacerlos después de validar manualmente todos
los formularios.

Pendiente: validación manual del usuario, registrar incidencias y corregirlas,
prueba final y commits por módulo. Los borradores caducados se ocultan a los
siete días y se eliminan cuando el usuario vuelve a consultar o guardar; una
limpieza física periódica de usuarios inactivos queda como limitación operativa.
Después del cierre se pedirán especificaciones para documentar la propuesta
de simplificación de personal. ISS-20 queda para la etapa siguiente.

## Seguimiento 2026-09-17: validación manual de Personal

El usuario encontró que Volver navegaba sin permitir elegir y que el autoguardado
persistía cambios de Personal sin consentimiento. También observó una lista de
borradores desactualizada tras guardar otro Investigador y un valor de horas
semanales reemplazado al interactuar con un borrador existente.

Se desactivó el autoguardado solo en Personal, Becario e Investigador. Sus botones
Volver piden explícitamente la decisión antes de navegar. El cache de la lista
se actualiza de inmediato al guardar o eliminar un borrador y luego se revalida
con el servidor. La prueba de los tres formularios verifica que Volver no llama
a navegación antes de la decisión y que `autosave` está desactivado. Las 110
pruebas frontend, `typecheck`, build de producción y `git diff --check` pasan.
Sigue pendiente la validación manual del usuario en Personal, Becario e
Investigador, incluidas las horas semanales y la lista con varios borradores.

Por instrucción del usuario, detener el trabajo después de corregir Personal y
esperar su aprobación del comportamiento antes de ajustar otros formularios.

## Seguimiento 2026-09-17: lista visible desde detalle de Personal

El usuario confirmó que Volver y la recuperación de los valores funcionan, pero
observó que la lista global de borradores no reflejaba el borrador nuevo al
regresar al detalle de Investigador. Los registros HTTP mostraron guardado y
listado con estado 200; el formulario recuperaba el borrador. Se actualizó
`AppLayout` para consultar la lista al cambiar de ruta, al recuperar el foco
de la ventana y cada vez que se abre la lista. Durante la consulta se muestra
un estado de actualización, sin presentar las entradas antiguas como actuales.
Pasaron 110/110 tests frontend, `typecheck`, build de producción y
`git diff --check`. Pendiente: nueva validación manual del usuario de la lista
desde el detalle. No se hicieron commits ni se avanzó a otros formularios.

## Seguimiento 2026-09-18: aviso de borradores antiguos

El usuario indicó que el aviso de dos borradores persistía en home y otras
pantallas. La base de desarrollo confirmó que existían exactamente dos filas
vigentes del mismo usuario: `personal-investigador/29`, guardada el 17/09 a las
22:35 UTC, y `personal-becario/31`, guardada el 17/09 a las 22:11 UTC. No eran
entradas inventadas por el cache. Las solicitudes de guardado posteriores al
último descarte explican que sigan activas durante la retención de siete días.

Se agregó a la lista global una acción para descartar cada borrador con
confirmación. La eliminación actualiza el contador de inmediato y reconsulta
el servidor. No se eliminaron datos del usuario por cuenta del agente.
Pasaron 110/110 tests frontend, `typecheck`, build de producción y
`git diff --check`. Pendiente: validación manual del descarte desde la lista
y del conteo resultante.

## Seguimiento 2026-09-18: identificación de borradores de Personal

El usuario confirmó que las entradas eran correctas, pero `Becario #n` e
`Investigador #n` no permitían reconocer intuitivamente el registro. El
endpoint de listado ahora incluye `display_name` únicamente para borradores de
Personal con nombre formado por letras y espacios; el resto del contenido no
sale en el listado. La UI muestra `Tipo: Nombre Apellido` y deja el ID debajo.
Se verificó que un borrador real de Becario produce nombre legible sin volcar
el valor en los logs de validación. Pasaron 6/6 pruebas backend de borradores,
110/110 frontend, `typecheck`, build de producción y `git diff --check`.
Pendiente: validación manual del nuevo texto en la lista. Sin commits.

## Seguimiento 2026-09-18: aviso con un solo borrador

El usuario recuperó y descartó el borrador de Cali Falco; el aviso desapareció
aunque todavía quedaba el borrador de Felipe Kaisser. La causa era una condición
de UI que mostraba el aviso únicamente con más de un borrador. `AppLayout`
ahora mantiene el acceso a la lista con uno o más borradores y usa texto en
singular cuando corresponde. Pasaron 110/110 pruebas frontend, `typecheck` y
`git diff --check`. Pendiente: validación manual del aviso con un único
borrador. No se hicieron commits.

## Seguimiento 2026-09-18: replica transversal tras aprobacion de Personal

El usuario valido la lista de borradores y autorizo replicar el comportamiento
de Personal en el resto del sistema. Se desactivo el autoguardado de los
formularios cubiertos en grupo, memorias, produccion, proyectos, recursos y
transferencia. Volver usa `requestLeave` antes de navegar, con las opciones
guardar, descartar o continuar editando. El contrato de listado calcula
`display_name` desde campos identificadores de cada modulo, sin incluir
`data` en la respuesta. Se actualizaron pruebas backend y README de cada
modulo. El hook compartido usa `autosave: false` como valor predeterminado y los 15
formularios restantes lo declaran expresamente. Pasaron 110/110 pruebas
frontend, `typecheck`, build de produccion, 7/7 pruebas backend de borradores
y `git diff --check`. La prueba backend se ejecuto en Docker porque el Python
local no tiene Flask. Pendiente: validacion manual de los formularios y cierre
de la tarea; no ejecutar commits hasta aceptacion del usuario.

## Seguimiento 2026-09-18: validación transversal

El usuario confirmó que los borradores del resto del sistema funcionan, con
la única excepción de Transferencias, cuyo listado no cargaba. La causa fue
una redirección del GET sin barra final al host interno `backend`. La ruta se
corrigió en el service de Transferencias (ISS-24). Sigue pendiente únicamente
la prueba manual del borrador de Transferencias antes de cerrar ISS-22 y
ejecutar los commits autorizados para después de la validación.

## Cierre 2026-09-18

El usuario confirmo el funcionamiento de los borradores en todos los modulos, incluida Transferencias, y autorizo ejecutar los commits. Validacion final: 111/111 pruebas frontend, typecheck, build de produccion, 7/7 pruebas backend de borradores, comprobacion del proxy y prueba manual del usuario. Limitacion: limpieza fisica de borradores vencidos de usuarios inactivos sin tarea periodica.

Mensaje de commit propuesto: `feat(borradores): persistir borradores por usuario en el servidor`.
