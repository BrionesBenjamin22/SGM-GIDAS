# Funcionalidades compartidas

## Breadcrumb contextual de becas (ISS-40)

`RouteBreadcrumbs` pasa ruta y estado de navegación a `getRouteBreadcrumbs`.
En detalle o edición de una beca abierta desde un becario, el estado válido
`becarioReturnTo` produce `Inicio > Personal > Becario > Beca` y, cuando
corresponde, `Editar`. El enlace Becario restaura query, hash y el estado del
detalle original; Beca conserva el origen al volver desde edición. Cada
`BreadcrumbItem` puede definir su propio `state`, sin heredar el contexto de
otra pantalla. Los mensajes de éxito se retiran del estado de los enlaces.

Sin origen válido se conserva la jerarquía por URL. El cambio no registra un
historial global de visitas ni modifica sidebar, layout o router.
`routeBreadcrumbs.test.ts` verifica resolución y destinos; `becarioDetalle.test.ts`
verifica el componente compartido, los enlaces renderizados y sus estados.

## Iconos de historial y auditoría

`src/components/HistorialCambiosCard.tsx` incorpora History en su encabezado,
por lo que todos sus consumidores lo reciben sin cambios por módulo. Su formato,
desplegable y paginación se conservan. Auditoría sigue compuesta en cada pantalla:
no existe una tarjeta global. ShieldCheck se incorporó en `PersonalDetalle`,
que lo muestra para las clases de Personal; no se extendió a auditorías de otros
módulos. Los iconos decorativos usan `aria-hidden="true"`.
La etapa fue aceptada el 05/11/2026; 234 pruebas frontend, TypeScript y build
aprobados, con autorización explícita para ejecutar commits.

## Validacion preventiva compartida (ISS-33)

`src/lib/liveValidation.ts:updateLiveValidationErrors` recibe errores visibles,
resultado anterior y siguiente de las comprobaciones y el campo editado.
Reemplaza solo ese campo y las reglas cuyo resultado cambia por dependencia;
conserva los demas mensajes y no muta el objeto recibido. Cada formulario pasa
los valores siguientes explicitamente y reutiliza sus reglas al guardar.
La utilidad es pura: no incorpora hooks, estado global ni solicitudes HTTP.
Los controles nativos validan tambien al perder foco; Calendar conserva su
feedback propio de formato y rango. Los errores del servidor siguen usando
`error.details.fields` y el feedback general existente.

## Horas de auditoría e historial

Las vistas que consumen `src/utils/dateTime.ts:formatFechaHora` muestran los
instantes en la zona `America/Argentina/Buenos_Aires` y en formato de 24 horas,
con segundos y medianoche como `00:00:00`, independientemente de la zona del
equipo. Esto incluye Auditoría, Historial de cambios y fechas de versiones de
Memorias que ya usan el mismo formateador.

Los timestamps heredados sin zona se interpretan como UTC; los que incluyen
`Z` u offset conservan su instante. Por ejemplo, `2026-09-07T02:13:31Z` se
presenta como `6/9/2026, 23:13:31`. Valores ausentes o inválidos mantienen el
fallback del consumidor. Las fechas civiles de formularios siguen su contrato
independiente; no se modifican datos almacenados ni payloads de la API.

`frontend/tests/dateTime.test.ts` cubre distintas zonas del equipo, formatos de
entrada equivalentes, medianoche, cambios de día y año y valores inválidos.

## Breadcrumbs de navegación (ISS-41)

`components/RouteBreadcrumbs.tsx` presenta la ruta actual con una lista ordenada
dentro de un `nav` accesible. El último elemento usa `aria-current="page"`; los
anteriores enlazan únicamente a pantallas existentes. Los enlaces conservan el
estado de navegación necesario para Memorias y descartan `successMessage` para
evitar avisos repetidos. Los formularios mantienen el bloqueo de salida del hook
de borradores cuando hay cambios pendientes.

`utils/routeBreadcrumbs.ts` resuelve las etiquetas y destinos desde el pathname
del router. Cubre rutas públicas, Inicio, listados, altas, detalles, ediciones,
versiones de Memorias y la pantalla no encontrada. Los alias antiguos redirigen
a rutas canónicas o llevan al listado de Personal. Las etiquetas `Detalle` y
`Versión` no exponen IDs; los IDs permanecen en los destinos necesarios para
navegar. La ruta `/uct/nueva` enlaza a Inicio porque no existe un listado UCT.

`AppLayout` muestra el componente antes del contenido de cada ruta autenticada.
El login y el registro lo montan en sus propias vistas; la portada pública lo
omite. La prueba
`frontend/tests/routeBreadcrumbs.test.ts` comprueba la cobertura de las rutas
declaradas en el router y que ninguna etiqueta muestre un ID.

## Borradores de formularios

`useFormDraft` coordina carga, guardado automático, descarte y confirmación de
navegación. `formDraftService` consume los endpoints `/api/v1/borradores` sin usar
almacenamiento del navegador para el contenido. El perfil muestra la lista del
usuario y un aviso mientras haya al menos un borrador activo.
La lista permite abrir cada borrador o descartarlo con una confirmación. Tras
descartarlo, el contador se actualiza y se vuelve a consultar el servidor.
Para Personal, Becario e Investigador, cada entrada muestra el nombre ingresado
en el borrador; el ID queda como referencia secundaria. Si aún no hay un nombre
válido, muestra el tipo de registro y el ID.

Los formularios admitidos pasan un objeto de valores serializable y una función
`onRestore` que reconstruye su estado controlado. Una salida con cambios ofrece
guardar el borrador, descartarlo o seguir editando. El guardado definitivo elimina
el borrador. El estado visible distingue guardando, guardado y fallo.

La confirmación de salida compara los valores actuales con la base capturada al
iniciar el formulario de alta o edición. Después de recuperar o guardar un
borrador, la última versión guardada pasa a ser la base. «Volver» y la navegación
por rutas salen sin confirmación cuando no hay diferencias; si el usuario revierte
todos los cambios, tampoco se muestra el diálogo. La prueba
`frontend/tests/formDraftLeave.test.ts` cubre estos casos y las acciones de guardar
y descartar desde la confirmación.

El payload lleva `__draft_meta.schema=1` y una huella de los valores originales.
Al recuperar una edición, si esos valores difieren de los actuales, el diálogo
avisa que el registro cambió para que se revisen los datos antes de guardar.
La huella detecta cambios de interfaz; no es una firma de seguridad.

Los formularios de contraseñas y credenciales quedan excluidos. El backend
revalida módulo, tamaño y claves sensibles, y mantiene el aislamiento por usuario.
La versión recuperable después de perder la sesión es la última confirmada por el
servidor; cambios aún pendientes de envío pueden perderse.


## Estado de consulta de los homes (ISS-50)

`hooks/useHomeState.ts` conserva controles de consulta en sessionStorage bajo
`gidas:homes:v1:`, con aislamiento por usuario, ruta, query, Memoria/version/seccion
y catalogo cuando aplica. `utils/homeState.ts` valida estructura, enumeraciones,
IDs y paginas positivas, limita tamanios y tolera JSON invalido o storage bloqueado.
La escritura ocurre al cambiar el control, antes de un eventual desmontaje por
expiracion. No almacena filas de API, credenciales, borradores ni acciones pendientes.

`useHomeFilterEffect` compara los filtros por valor y evita el reinicio inicial
de pagina; cambios posteriores conservan el comportamiento de volver a pagina uno.
Los limites de paginacion esperan datos antes de corregir una pagina fuera de rango.
Al recuperar los controles se consultan resultados actuales con los services y
permisos existentes, sin endpoints nuevos. Los callbacks del contexto anterior
no escriben sobre el siguiente usuario o ruta.

La persistencia corresponde a la pestana; F5 y una copia de pestana pueden
recuperar el contexto. No sincroniza filtros en vivo entre pestanas ni garantiza
conservarlos al cerrar el navegador. El cierre explicito de sesion limpia el
destino de reingreso; los controles guardados permanecen aislados por cuenta.

`tests/homeState.test.ts` ejecuta controles reales y los homes de Personal y
Proyectos desde el primer render. Los harness de Memorias y Transferencias usan
el hook compartido real; `tests/searchSessionNavigation.test.ts` comprueba
pagina recuperada, renovacion del token y cambio real de UCT.
Aceptacion visual y funcional del usuario: 06/11/2026.
