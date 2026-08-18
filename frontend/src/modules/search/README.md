# Busqueda global

La busqueda se ejecuta automaticamente luego de 400 ms sin escritura y requiere
al menos dos caracteres. Cada nueva consulta cancela la anterior mediante
`AbortController`; un identificador interno impide que una respuesta antigua
reemplace resultados recientes.

El hook conserva hasta 30 consultas durante 30 segundos. La clave incluye texto,
orden, estado y pagina. El endpoint se consume con paginas de 9 resultados.

## Contratos y validaciones

El service usa `URLSearchParams` para codificar la consulta y acepta exclusivamente
los ordenamientos `alf_asc`, `alf_desc`, `fecha_asc` y `fecha_desc`. La pagina se
normaliza a un entero positivo y el texto requiere entre 2 y 80 caracteres. Los
rangos de fecha inconsistentes se rechazan antes de presentar resultados filtrados.

La respuesta se valida defensivamente antes de convertirla a `SearchResult`. Los
elementos heterogeneos de `extra` se leen mediante guards y solo se conservan IDs,
etiquetas y URLs con tipos validos. Las URLs externas o protocol-relative se
rechazan y redirigen a la busqueda.

## Seguridad y estados

El resaltado se construye con nodos React desde texto, sin HTML inyectado. Los
errores usan el extractor seguro compartido y muestran un mensaje accionable. Las
consultas anteriores se cancelan con `AbortController` y un identificador impide que
una respuesta tardia reemplace resultados recientes.

La busqueda respeta los permisos del endpoint; el frontend no usa el filtrado visual
como barrera de autorizacion. Los resultados se paginan de a 9 y los parametros
validos se reflejan en la URL para permitir navegacion reproducible.

Antes de desplegar deben ejecutarse typecheck, build, tests backend y
`python tools/verify_search_retrieval.py`. Este ultimo comando es de solo lectura
y valida recuperacion real en los 24 modulos buscables. La falta de datos activos
se considera una validacion pendiente, no un resultado exitoso.
