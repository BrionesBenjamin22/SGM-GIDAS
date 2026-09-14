# Memorias

## Contrato de fechas

Los períodos de memoria se validan desde el 01/01/2010 y deben conservar el
orden cronológico y la pertenencia a un único año calendario. Las marcas de
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
