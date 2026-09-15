# Producción

## Contrato de fechas

Las fechas de docencia, publicaciones, reuniones, distinciones, documentación
y propiedad intelectual se validan desde el 01/01/2010. Cada service conserva
su regla vigente respecto de fechas futuras y del orden de sus períodos.

## ISS-12: autoría de integrantes

Trabajos en reuniones científicas y revistas tienen una colección `autores`.
Cada referencia enviada es `{ "rol": "investigador" | "becario", "id": entero }`.
La identidad es `(rol, id)`: los IDs pueden coincidir entre las tablas de personal.
La respuesta agrega `nombre_apellido`, `tipo` y `activo`. Solo Investigador y
Becario pueden ser autores; Personal (PTAA/profesional) y externos se rechazan. No hay dos
colecciones independientes por categoría.

### Endpoints y payloads

Bases: `/api/v1/produccion/trabajos-reunion-cientifica` y
`/api/v1/produccion/trabajos-revistas`.

- `GET /`: lista con `activos`, `orden`, `autor_rol` y `autor_id`; estos dos
  últimos se envían juntos. Se conservan los filtros específicos de cada entidad.
- `GET /<id>`: datos, auditoría y autores, incluidas asociaciones históricas inactivas.
- `GET /<id>/historial`: cambios de campos y eventos `autores` con acción,
  nombre, categoría, origen e ID del integrante.
- `POST /`: payload anterior más `autores: [{rol, id}]`; crea el trabajo y
  vincula autores dentro de una única transacción.
- `PUT /<id>`: solo diferencias reales. `autores`, cuando está presente,
  reemplaza la colección completa con altas/bajas consolidadas. Omitirlo
  conserva la colección; `[]` la vacía. No se auditan cambios inexistentes.
- `DELETE /<id>/autores`: `{ "autores": [{rol, id}] }` elimina únicamente
  esas asociaciones, también si el integrante está inactivo o eliminado.
- `DELETE /<id>` y `PUT /<id>/restore`: conservan soft delete y restauración.

Se retiraron las rutas `/investigadores`, el filtro `investigador_id` y el
campo exclusivo `investigadores`. Los consumidores deben usar el contrato nuevo.
Las lecturas requieren ADMIN/GESTOR/LECTURA; las escrituras ADMIN/GESTOR.

### Responsabilidades e integridad

`trabajo_autores_service.py` valida referencias y sincroniza asociaciones sin
commits; cada service de trabajo administra la transacción y su rollback ante
fallos de persistencia/auditoría. Las altas requieren integrantes existentes,
activos y no eliminados. Se pueden conservar y quitar asociaciones históricas;
no se pueden volver a agregar integrantes inactivos. Se rechazan roles inválidos,
IDs no enteros positivos y duplicados dentro de una misma categoría.

`TrabajoReunionAutor` y `TrabajoRevistaAutor` tienen FK al trabajo y a los dos
orígenes de integrantes. Un CHECK exige exactamente un origen por fila, UNIQUE
por trabajo/origen evita duplicados y los índices cubren todas las FK. La baja
física del trabajo elimina asociaciones; las FK de integrantes usan RESTRICT.
La baja funcional usa soft delete; los eventos relacionales permanecen en auditoría.
La carga `selectin` de autorías y la carga de integrantes evitan una consulta
por cada trabajo al listar o exportar.

### Memorias y entorno de testeo

Los snapshots almacenan `autores` como JSON con identidad, nombre y categoría
al cierre; cambios posteriores del integrante no alteran esa versión.
La exportación de memoria y la exportación de grupo muestran todos los autores
con su categoría. La plantilla de revistas conserva sus seis columnas y agrega
los autores en la celda de título, con encabezado `Titulo trabajo / Autores`.
La búsqueda global recupera trabajos por cualquier autor y devuelve `extra.autores`.

La revisión `a12b9c4d6e80` mantiene compatibilidad con `flask db upgrade`/Docker.
Por decisión del usuario, reemplaza el esquema sin copiar asociaciones ni textos
anteriores de snapshots; el downgrade solo restaura estructura. Regenerar los
datos de testing y cerrar nuevas versiones de memoria. El seed de testing agrega
autoría mixta a los trabajos sin autores y es idempotente. No se toca la instancia
existente durante las pruebas automatizadas, que usan SQLite temporal.

### Validación

`tests/test_trabajo_autores.py` verifica persistencia real, IDs coincidentes,
investigador/becario/mixtos, rechazo de Personal, datos inválidos, duplicados, CHECK/FK/UNIQUE,
altas/bajas consolidadas, auditoría, permisos, rollback de la transacción, búsqueda
global y exportación XLSX de snapshots inmutables. Las suites de historial,
memorias, errores de producción y exportaciones cubren las regresiones.

### Corrección de alcance

La revisión `b12c8d5e7f90`, posterior a la ya instalada `a12b9c4d6e80`, retira
las asociaciones con Personal, elimina su FK y actualiza el CHECK a exactamente
un investigador o becario. También elimina Personal de los snapshots de testing;
conserva los autores habilitados y la auditoría previa. El downgrade solo
restaura la estructura anterior, sin recuperar esas asociaciones. El seed
genera exclusivamente investigadores y becarios como autores para ambos trabajos.

## ISS-13: fecha de presentación de trabajos en reuniones

TrabajoReunionCientifica y TrabajoReunionCientificaMemoriaVersion usan
fecha_presentacion (Date no nula). POST/PUT y respuestas GET/snapshots usan
fecha_presentacion en YYYY-MM-DD. Solicitudes antiguas pueden enviar
fecha_inicio temporalmente; se normaliza a fecha_presentacion sin alterar
el payload original. Ambos campos iguales se aceptan; distintos se rechazan
con 400 y error de campo, sin cambios persistidos. La respuesta solo expone
el nombre nuevo. Se mantienen permisos y auditoría, fecha mínima 2010-01-01
y prohibición de fecha futura. Duplicados y orden asc/desc usan la nueva fecha.
La pertenencia a memoria usa su período inclusivo sobre fecha_presentacion:
31/12 corresponde al año que termina y 01/01 al siguiente. El snapshot congela
la fecha. La revisión c13d7e9a2b40 renombra las columnas de trabajos y snapshots,
conserva valores y admite downgrade que restaura los nombres anteriores.
Los eventos históricos conservan su campo original; nuevos eventos usan
fecha_presentacion. Tests reales: test_trabajo_fecha_presentacion.py verifica
API, alias, rechazo de conflictos, fechas inválidas, auditoría, orden, límites
anuales, XLSX y migración/downgrade preservando filas.

## ISS-14: enlace opcional de trabajos

Congresos/reuniones y revistas aceptan `enlace` opcional en POST/PUT y lo
exponen en GET y snapshots como string o null. Ausente en alta, null o texto
vacío se almacenan como null; ausente en edición conserva el valor previo.
Se recortan espacios exteriores sin alterar mayúsculas ni contenido del DOI.
Admite HTTP/HTTPS con host, hasta 2048 caracteres; rechaza otros protocolos,
URLs incompletas, credenciales, espacios internos, controles, barras inversas
y puertos inválidos. Un DOI debe ingresarse como URL https://doi.org/… .
Error 400 con `error.details.fields.enlace`; no se consulta el destino.
Los cambios reales, incluida la eliminación del enlace, se auditan en `enlace`.
Se conservan permisos, autores y soft delete del trabajo. No modifica duplicados.

La revisión d14e8f0a3c51 añade String(2048) nullable a ambos trabajos y sus
snapshots. Registros existentes quedan con null. Downgrade elimina las cuatro
columnas y sus valores, conservando las filas; no reconstruye URLs eliminadas.
Tests test_trabajo_enlace.py cubren API, rechazo atómico, historial sin duplicados,
snapshot inmutable, XLSX y upgrade/downgrade con registros existentes.

La validación también rechaza hosts inválidos; admite dominios internacionalizados
y hosts IPv6 válidos mediante los analizadores de URL de cada plataforma.

## Pertenencia a memorias (ISS-16)

Los generadores filtran por la UCT. Publicaciones, documentación, registros, distinciones y trabajos usan su fecha puntual dentro del rango inclusivo; docencia usa el intervalo completo y conserva los grados que estuvieron vigentes. Las bajas se interpretan históricamente.