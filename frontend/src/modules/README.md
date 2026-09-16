# Frontend modular

## Errores accionables (ISS-09)

`src/lib/httpError.ts` interpreta el contrato vigente `error.code`, `error.message`
y `error.details.fields`, con compatibilidad para respuestas heredadas. El
`request_id` es metadata operativa para correlacion interna y no contenido de UI.
`mapFieldErrors` adapta las claves API a los nombres de los controles del formulario.
`applyFieldErrors` muestra los errores junto a los campos y enfoca el primero en
orden visual; devuelve `false` si quedan campos desconocidos para conservar el aviso
general. `Field` asocia etiqueta, `aria-invalid`, descripción y mensaje accesible,
sin duplicar los errores que ya aparecen dentro del control.

Los errores generales usan `getErrorMessage`, que conserva mensajes publicos
seguros y descarta detalles tecnicos e identificadores de seguimiento. El ID
permanece en el contrato HTTP y en `X-Request-ID` para logs y diagnostico interno,
pero nunca se agrega al texto visible. Los mensajes de éxito,
las reglas de validación y el momento de validación existentes se conservan.
No se incorporan validaciones en tiempo real ni indicadores verdes.

## Contrato transversal de fechas institucionales

Seguimiento ISS-08: Calendar informa fechas imposibles, incompletas al salir del
campo y límites mínimo/máximo; resalta el input y anuncia el error accesiblemente.
Al rechazar conserva la fecha confirmada anterior. El error se limpia al ingresar
una fecha válida, vaciar, cancelar con Escape o confirmar desde el calendario.

Los formularios de entidades usan `Calendar`, que aplica `2010-01-01` como
límite inferior predeterminado. Cada módulo conserva su propia regla sobre
fechas futuras y sobre el orden de los períodos. Los calendarios destinados a
filtrar búsquedas declaran `institutionalRange={false}` porque no crean ítems.

Este directorio organiza la aplicacion React como monolito modular. Cada modulo
agrupa la implementacion real de sus vistas, hooks y services por dominio.

El router carga las paginas de cada modulo mediante `lazy` e imports dinamicos.
Los consumidores internos importan directamente desde los modulos. No se
mantienen fachadas paralelas en `src/pages`, `src/services` ni `src/hooks`.

## Carga y recuperacion de rutas

- Cada pagina se entrega como chunk diferido; el layout, la autenticacion y las
  protecciones de rutas permanecen en el bundle base.
- `Suspense` muestra feedback accesible mientras se descarga una pagina.
- Un limite de errores global ofrece una accion de reintento si falla la descarga
  o evaluacion del chunk.
- Agregar una pagina al router con un import estatico invalida la prueba
  `tests/routeCodeSplitting.test.ts`.
- Los nombres de chunks no deben contener secretos y ninguna variable `VITE_*`
  debe almacenar credenciales.

## Capas por modulo

- `pages`: vistas de home, formulario y detalle del dominio.
- `services`: clientes HTTP, tipos TypeScript y contratos de API.
- `hooks`: hooks reutilizables del dominio, normalmente basados en React Query.
- `components`: reservado para componentes especificos del dominio. Los
  componentes globales reutilizables permanecen en `src/components`.

## Modulos

- `auth`: login, registro, perfil, cambio de contrasena y usuarios.
- `catalogos`: catalogos transversales y objetos de financiamiento.
- `dashboard`: vista principal y consultas agregadas.
- `grupo`: UCT, planificaciones, programas, cargos, directivos y visitantes.
- `memorias`: memorias, versiones y exportacion.
- `personal`: personal, investigadores, becarios y tipos asociados.
- `produccion`: docencia, documentacion, publicaciones, distinciones, registros
  y trabajos cientificos.
- `proyectos`: proyectos de investigacion y participaciones relevantes.
- `recursos`: equipamiento, erogaciones y becas.
- `search`: busqueda transversal.
- `shared`: hooks o services transversales que no pertenecen a un dominio.
- `transferencia`: transferencias socio-productivas, adoptantes y contratos.

## Convenciones

- Las nuevas funcionalidades deben crearse directamente en
  `src/modules/<modulo>`.
- Los imports deben usar `@/modules/<modulo>/...`.
- No recrear fachadas en `@/pages`, `@/services` ni `@/hooks`.
- El router principal, layout global, auth context, estilos base y componentes
  globales no deben modificarse sin una decision explicita del proyecto.
- Cada modulo debe mantener services dedicados, tipos TypeScript, hooks,
  validaciones y manejo uniforme de errores cuando corresponda.

## Contrato de feedback de acciones (ISS-09)

Button acepta loading y loadingText (por defecto Procesando...). Cuando
loading es true muestra un icono decorativo con respeto a movimiento reducido,
un texto anunciado como status y aria-busy, y deshabilita la acción.
Cuando finaliza conserva children y cualquier disabled establecido por permisos
o validaciones. Los formularios pasan isPending/isSaving durante el guardado.

ConfirmDialog acepta las mismas propiedades y espera automáticamente una
promesa devuelta por onConfirm. Un bloqueo inmediato impide confirmar dos veces
antes del siguiente render. Mientras espera impide cancelar, cerrar desde el
fondo y editar sus campos. Los callbacks de mutaciones deben devolver
mutateAsync, no mutate. Un fallo no manejado conserva un aviso seguro en el
diálogo y libera el bloqueo; al reabrir se limpia el aviso. Las acciones
síncronas que solo preparan cambios locales no simulan esperas del servidor.

Pruebas de regresión: tests/actionFeedback.test.ts verifica los componentes
reales mediante SSR y un harness de hooks, sin navegador. Las pantallas de
autenticación conservan sus estados de carga existentes.

## Campos obligatorios (ISS-21)

Los formularios usan `Field required` para marcar con un asterisco rojo los campos que la validacion exige antes de guardar. Los campos opcionales y las condiciones que solo se validan cuando tienen valor no se marcan. Los controles con etiqueta propia siguen el mismo criterio visual. Esta marca no sustituye la validacion de frontend ni la del backend.
