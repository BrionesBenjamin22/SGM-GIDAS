---
id: ISS-24
title: Corregir presentación de participaciones y carga de transferencias
status: finished
area: frontend
module: proyectos-transferencia
priority: alta
risk_level: medio
created_at: 2026-09-18
updated_at: 2026-09-18
closed_at: 2026-09-18
owner: Codex
related_tasks:
  - ISS-22
  - ISS-23
---

# Objetivo

Mostrar el nombre de Participaciones relevantes con mayúsculas consistentes
en home y detalle. Evitar que el listado de Transferencias redirija al nombre
interno de Docker y permita la última prueba manual de borradores.

# Diagnóstico

La configuración Vite servida en Docker usa `/api/v1`. El service de
Transferencias consultaba `/transferencias?activos=true` sin barra final; la
ruta Flask de GET requiere `/transferencias/`. Flask emitía 308 con
`Location: http://backend:5000/...`, que el navegador no puede resolver.
La prueba contra el proxy reprodujo ese 308. La ruta canónica con barra llegó
al backend y respondió 401 por falta de credenciales, sin redirección.

# Estado

Se corrigió la ruta GET del listado y se agregó prueba de contrato. Los
nombres de Participaciones relevantes se presentan con `toTitleCase` en home,
detalle y confirmación de baja, sin alterar los datos persistidos.

Validación técnica: 111/111 pruebas frontend, `typecheck`, build de producción
y `git diff --check`. La llamada GET corregida llegó
al backend mediante Vite y respondió 401 sin credenciales, sin redirección;
la llamada anterior reproducía 308 con `Location` al host interno. Pendiente:
validación manual de Transferencias y su borrador. No ejecutar commits antes
de la validación solicitada para ISS-22.

## Cierre 2026-09-18

El usuario confirmo el funcionamiento de Transferencias y autorizo los commits. Validacion final: 111/111 pruebas frontend, typecheck, build de produccion, contrato GET de Transferencias y comprobacion del proxy sin redireccion.

Mensaje de commit propuesto: `fix(transferencia): evitar redireccion al host interno de Docker`.
