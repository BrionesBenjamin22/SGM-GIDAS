---
id: ISS-86
title: Estandarizar la interfaz del listado de Memorias por período y versión
status: pendient
area: frontend
module: memorias
priority: media
risk_level: medio
created_at: 2026-09-29
updated_at: 2026-09-29
source: solicitud-usuario
owner: Codex
---

# Objetivo

Alinear la pantalla principal de Memorias con los patrones visuales y de interacción del resto del sistema, organizando las Memorias por período y sus versiones dentro de filas expandibles.

# Alcance

- Mostrar una fila principal de la tabla por cada Memoria de un período. Evitar que las versiones aparezcan como filas principales independientes.
- Cada fila principal tendrá un control colapsable que muestre las versiones de esa Memoria, con su número o identificación, estado y acciones disponibles.
- Presentar las acciones en la versión a la que afectan y habilitarlas según su estado y los permisos del usuario. Mantener las reglas de negocio y destinos de navegación vigentes.
- Adaptar tabla, controles, mensajes y estados de carga, error y vacío al lenguaje visual del sistema; contemplar teclado, accesibilidad y pantallas pequeñas.
- Conservar la paginación del home en un máximo de nueve Memorias por página, contando períodos/Memorias principales y no versiones internas.

# Criterios de aceptación

- Cada Memoria de un período ocupa una sola fila principal y sus versiones aparecen únicamente al expandirla.
- Cada versión muestra claramente su estado y solo las acciones permitidas para esa versión y el rol activo.
- Expandir o contraer una Memoria no ejecuta acciones de versión ni altera los datos; el control es accesible por teclado e indica su estado.
- La tabla se entiende y opera en escritorio y móvil, con estados de carga, error y vacío coherentes con el resto del sistema.
- La paginación limita a nueve Memorias principales por página y no corta las versiones de una Memoria entre páginas.
- Se verifican manualmente la navegación, los permisos, los estados de las versiones y el comportamiento responsive antes de cerrar la tarea.

# Estado

Pendiente de implementación. Seguir el ciclo de `AGENTS.md`: validación técnica, validación visual y funcional del usuario, documentación técnica y `CHANGELOG.md` tras la aceptación, cierre y propuesta de mensaje de commit. No ejecutar el commit sin solicitud expresa.
