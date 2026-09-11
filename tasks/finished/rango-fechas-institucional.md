---
id: rango-fechas-institucional
title: Aplicar el rango institucional a las fechas del sistema
status: finished
area: cross-cutting
module: fechas-institucionales
priority: alta
risk_level: alto
created_at: 2026-09-10
updated_at: 2026-09-10
closed_at: 2026-09-10
source: validacion-manual-iss-06
owner: codex
blocked_by: []
commit_sugerido: "fix(fechas): aplicar rango institucional desde 2010"
related_files:
  - frontend/src/components/Calendar.tsx
  - frontend/src/modules/
  - backend/modules/shared/
  - backend/modules/grupo/
  - backend/modules/personal/
  - backend/modules/produccion/
  - backend/modules/proyectos/
  - backend/modules/recursos/
  - backend/modules/transferencia/
  - backend/modules/memorias/
---

# Objetivo

Aplicar `2010-01-01` como fecha mínima institucional a los hechos, actividades,
incorporaciones, mandatos, períodos y registros vinculados con la vida del grupo.

# Alcance

- Centralizar la constante y la validación reutilizable en frontend y backend.
- Impedir seleccionar o persistir fechas institucionales anteriores al 01/01/2010.
- Conservar las reglas de orden entre inicio y fin de cada dominio.
- Conservar las reglas existentes sobre fechas futuras; para directivos, impedir
  además asunciones y finalizaciones posteriores a la fecha actual.
- Excluir fechas biográficas o de identidad, como nacimiento, porque no describen
  actividad posterior a la creación del grupo.
- Documentar el contrato transversal y cada módulo afectado.

# Criterios de aceptación

- [x] Los selectores institucionales no permiten fechas anteriores al 01/01/2010.
- [x] El backend rechaza el mismo rango aunque se omita el frontend.
- [x] Las fechas de fin mantienen la coherencia con sus fechas de inicio.
- [x] Directivos no admite asunciones ni finalizaciones futuras.
- [x] Las fechas personales ajenas a la actividad del grupo no quedan restringidas.
- [x] Existen pruebas frontend y backend del límite inferior y de las reglas de directivos.

# Cierre

- Se incorporaron utilidades compartidas en frontend y backend.
- Se actualizaron los services de Grupo, Personal, Producción, Proyectos,
  Recursos, Transferencia y Memorias.
- Se ajustaron el calendario global, el formulario de UCT y la excepción de
  filtros de búsqueda.
- Se documentó el contrato en los README de los módulos afectados.
- Frontend: typecheck, 66 pruebas y build productivo correctos.
- Backend: 11 pruebas focalizadas y compilación correctas. En la regresión
  completa pasaron 352 pruebas; 3 pruebas de plantilla HTTPS fallaron porque el
  contenedor backend no monta archivos ubicados fuera de `/app`.
- La comprobación manual de pantallas queda a cargo del usuario al finalizar el
  flujo de tareas.
