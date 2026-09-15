# Memorias

## Contrato de fechas

Los períodos de memoria se validan desde el 01/01/2010 y deben conservar el
orden cronológico y la pertenencia al rango configurado. Las marcas de
apertura y cierre son timestamps de workflow y no fechas ingresadas de un ítem.

## ISS-12: autoría de integrantes

Los snapshots de ambos tipos de trabajos almacenan autores como JSON con identidad compuesta (rol, id), nombre y categoría al cierre. La exportación incluye todos los autores; revistas los agrega en la celda de título para conservar las seis columnas de la plantilla. Corregida la resolución de la ruta de la plantilla hacia backend/assets. El cambio de esquema de testing no conserva snapshots anteriores: regenerar datos y cerrar versiones nuevas.

Corrección de alcance ISS-12: los autores de trabajos son únicamente investigadores y becarios. Personal (PTAA/profesional) no puede vincularse como autor. Se mantiene la etiqueta Autores.

## ISS-13: pertenencia anual de ponencias

Trabajos de congresos/reuniones se incorporan al snapshot por
fecha_presentacion dentro del período inclusivo de la memoria. Ambas columnas
de fecha (trabajo y snapshot) se renombran preservando sus valores. Exportación
de grupo y XLSX de memoria usan fecha_presentacion; el encabezado de reuniones
es Fecha de presentación. Revistas y fechas de otras entidades no cambian.

## ISS-14: enlace congelado de trabajos

Snapshots de congresos/reuniones y revistas copian `enlace` opcional al generarse.
La migración añade una columna nullable a ambas tablas históricas; snapshots
existentes conservan null, sin inventar enlaces desde registros actuales.
GET de snapshots serializa el valor congelado; Excel de memoria incluye
Enlace en la celda del título para conservar las columnas de la plantilla.
Excel de grupo incluye el enlace actual en el título. Los enlaces son texto,
sin fórmulas ni consultas remotas. Editar el trabajo no altera snapshots cerradas.
Las reglas de pertenencia y permisos no se modifican en esta tarea.

## ISS-16: períodos configurables por UCT

POST `/api/v1/memorias` requiere `grupo_utn_id`, `periodo_inicio` y `periodo_fin`. El rango puede cruzar años, es inclusivo y no puede solaparse con otra memoria de la misma UCT. ADMIN y GESTOR pueden crear y corregir fechas; la UCT solo puede asignarse a una memoria anterior sin asociación. Las correcciones, transiciones de estado y reaperturas se registran en `auditoria_campo`, consultable mediante GET `/{id}/historial`. El período se bloquea si existe una versión cerrada.

ADMIN y GESTOR pueden cambiar una memoria entre abierta, en revisión y cerrada;
la finalización del período no produce un cierre automático porque el cierre es
la operación que congela los snapshots. La reapertura y la baja permanecen
reservadas a ADMIN. En el historial, `grupo_utn_id` se presenta con la sigla de
la UCT y los registros anteriores que conservan un ID se resuelven al consultar.

El cierre selecciona cada entidad por UCT y por fecha puntual o solapamiento del intervalo funcional completo, incluyendo la baja lógica. La transacción revierte estado y fotos si falla cualquier generador. Las horas de integrantes corresponden al historial vigente al fin del período y quedan nulas si no existe evidencia. Se congelan además fecha de alta, datos institucionales, autoridades y planificación. UI y Excel leen estas fotos; una versión anterior sin contexto congelado no se reconstruye desde datos actuales.

La migración reversible `e16a0b2c4d60` conserva memorias existentes con UCT nullable. Una memoria previa abierta debe asociarse explícitamente antes de cerrar. El aislamiento de usuarios por pertenencia UCT continúa en `security-multitenancy-uct`.
