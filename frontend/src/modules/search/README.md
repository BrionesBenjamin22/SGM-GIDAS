# Busqueda global

La busqueda se ejecuta automaticamente luego de 400 ms sin escritura y requiere
al menos dos caracteres. Cada nueva consulta cancela la anterior mediante
`AbortController`; un identificador interno impide que una respuesta antigua
reemplace resultados recientes.

El hook conserva hasta 30 consultas durante 30 segundos. La clave incluye texto,
orden, estado y pagina. El endpoint se consume con paginas de 9 resultados.

Antes de desplegar deben ejecutarse typecheck, build, tests backend y
`python tools/verify_search_retrieval.py`. Este ultimo comando es de solo lectura
y valida recuperacion real en los 24 modulos buscables. La falta de datos activos
se considera una validacion pendiente, no un resultado exitoso.
