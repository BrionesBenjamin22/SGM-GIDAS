---
id: frontend-code-splitting
title: Reducir bundle inicial mediante carga diferida por modulo
status: pendient
area: frontend
module: performance
priority: media
risk_level: bajo
execution_order: 4
created_at: 2026-08-12
updated_at: 2026-08-12
source: security-audit
commit_sugerido: "perf(frontend): dividir bundle por rutas y modulos"
owner: unassigned
blocked_by:
  - auth-refresh-cookie-http-only
related_files:
  - frontend/src/main.tsx
  - frontend/src/modules/
  - frontend/vite.config.ts
---

# Riesgo y objetivo

El bundle principal es de aproximadamente 1.28 MB minificado. No es una fuga de
seguridad, pero aumenta tiempo de carga, parseo y superficie descargada antes de
autenticar. El objetivo es cargar por ruta/modulo sin modificar permisos ni UX.

# Alcance

- Medir baseline y rutas mas usadas.
- Incorporar `lazy`/`Suspense` por modulo.
- Evaluar `manualChunks` solo para dependencias estables.
- Mantener feedback accesible durante carga.
- Evitar que chunks revelen secretos; los nombres de modulos no son secretos.

# Criterios de aceptacion

- Bundle inicial por debajo del umbral acordado o reduccion documentada.
- Typecheck y build correctos.
- Navegacion, rutas protegidas y errores de chunks probados.
- Sin renders adicionales significativos ni cambio funcional.

# Mensaje de commit propuesto

```text
perf(frontend): dividir bundle por rutas y modulos
```
