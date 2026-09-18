---
id: ISS-23
title: Unificar la paginacion de los listados
status: finished
area: frontend
module: cross-cutting
priority: media
risk_level: bajo
created_at: 2026-09-18
updated_at: 2026-09-18
closed_at: 2026-09-18
owner: Codex
---

# Objetivo

Usar en los homes el formato de paginas numeradas y centradas de Registros de
propiedad y Personal, situado inmediatamente debajo de las tarjetas. Corregir
la ubicacion del paginado de Erogaciones.

# Estado inicial

Registros de propiedad, Personal, Docencia, Documentacion y Proyectos usan
paginas numeradas. Otros homes muestran Anterior/Pagina/Siguiente. Erogaciones,
Equipamiento, Transferencias y Memorias usan `mt-auto`, que puede empujar el
paginado al borde inferior. ISS-22 tiene cambios sin commit y sigue pendiente
de validacion manual; no mezclarlos en un commit.

# Seguimiento 2026-09-18

Se ajustaron los listados de Catalogos, Planificaciones, Visitantes, Memorias,
Personal, Articulos de divulgacion, Distinciones, Documentacion, Trabajos en
reunion, Trabajos en revista, Participaciones, Equipamiento, Erogaciones,
Busqueda y Transferencias. Los homes de Registros de propiedad, Docencia y
Proyectos ya tenian paginas numeradas centradas debajo de las tarjetas.
La paginacion queda inmediatamente despues de los resultados, sin `mt-auto`;
Planificaciones se movio dentro del contenedor de resultados. Los controles
tienen nombre accesible y anuncian la pagina actual. Se actualizaron los
README de los modulos frontend afectados.

Validacion: auditoria estatica de los 18 listados paginados, 110/110 pruebas
frontend, `typecheck`, build de produccion y `git diff --check`, todos correctos.
Pendiente: comprobacion visual del usuario con suficientes registros para
mostrar mas de una pagina. No se hicieron commits. ISS-22 sigue pendiente de
validacion y sus cambios no se deben mezclar en un commit de esta tarea.

## Cierre 2026-09-18

El usuario valido el comportamiento de los modulos y autorizo los commits. Validacion final: auditoria de los 18 listados, 111/111 pruebas frontend, typecheck, build de produccion y git diff --check.

Mensaje de commit propuesto: `style(listados): unificar paginacion centrada`.
