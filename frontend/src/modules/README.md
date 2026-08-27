# Frontend modular

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
