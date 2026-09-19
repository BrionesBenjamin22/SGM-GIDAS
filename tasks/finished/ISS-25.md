# ISS-25: Reformulacion del modulo Personal con tabla reutilizable

- Estado: Finalizada
- Inicio: 2026-09-19
- Cierre: 2026-09-19
- Alcance: componente global de tabla, home y formulario de Personal, listado paginado backend, pruebas y documentacion.

## Objetivo

Reemplazar las tarjetas del home de Personal por una tabla controlada y reutilizable, con busqueda, filtros, ordenamiento, paginacion, acciones e historial diferido. Mantener compatibilidad del listado plano y permitir categoria UTN y programa de incentivos opcionales en Investigador.

## Estado inicial

- Arbol de trabajo limpio.
- `PersonalHome` filtra y pagina en cliente y usa seleccion masiva.
- `/personal-all` devuelve una lista plana sin paginacion de base de datos.
- Categoria UTN y Programa de Incentivos son anulables en base y backend, pero obligatorios en frontend.

## Validaciones previstas

- Pruebas backend de Personal.
- Pruebas frontend.
- Typecheck frontend.
- Build de produccion frontend.
- Revision manual de accesibilidad y responsive mediante el markup y los estados controlados.

## Cambios realizados

- Se creo `frontend/src/components/Table.tsx` con API generica, toolbar,
  ordenamiento, expansion, estados, paginacion y comportamiento responsive y
  accesible.
- `PersonalHome` usa listado paginado de servidor, busqueda, chips, orden,
  acciones por permisos, navegacion desde la fila e historial diferido cacheado
  por rol e ID con 3 eventos por pagina.
- El historial relacional de becas se presenta con etiquetas, fechas y montos
  legibles, sin mostrar JSON de auditoria.
- El alta permite elegir claramente las tres clases. En edicion la clase no puede
  cambiar; Categoria UTN y Programa de Incentivos son opcionales y admiten baja
  explicita con `null`.
- Los tres formularios evitan el dialogo de borrador al volver desde una edicion
  sin cambios reales.
- `GET /api/v1/personal/all` conserva el contrato plano sin paginacion y ofrece
  un contrato paginado normalizado con filtros, busqueda, orden e IDs de memoria.
- Se actualizaron la documentacion tecnica de frontend y backend y el changelog.

## Validaciones ejecutadas

- Backend Personal: 32 pruebas aprobadas.
- Frontend: 117 pruebas aprobadas.
- TypeScript: `npm run typecheck` aprobado.
- Produccion: `npm run build:production` aprobado.
- Integridad del diff: `git diff --check` aprobado; solo advertencias esperadas
  de conversion LF/CRLF en el entorno Windows.
- Validacion manual del usuario: tabla, filtros, paginacion, acciones, historial,
  navegacion por fila y retorno directo desde edicion sin cambios.

## Incidencias y limitaciones

- No se requirio migracion de base de datos porque las relaciones opcionales de
  Investigador ya admitian valores nulos.
- El manual de usuario queda fuera de esta tarea.

## Aceptacion

- Etapa de Personal validada por el usuario el 2026-09-19.
- Mensaje de commit: `feat(personal): incorporar tabla reutilizable y simplificar la gestion`.
