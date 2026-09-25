# Validacion pre-merge y preparacion de servidor

Fecha: 2026-08-27
Rama: `dev`
Commit evaluado: `2496485`
Destino: merge hacia `main` y despliegue manual en una VM Linux por SSH.

## Objetivo

Registrar la evidencia obtenida, las limitaciones de la calificacion local, los
bloqueos del merge y la informacion necesaria para completar el despliegue.
Este documento no contiene secretos, certificados ni direcciones privadas.

## Resultado

El codigo, las imagenes y la topologia alcanzaron un estado funcional y fueron
integrados en `main` mediante una rama limpia. El servidor productivo final
permanece pendiente de HTTPS, configuracion real de la VM y secretos renovados.

## Cierre del merge

- estrategia aplicada: rama limpia creada desde `origin/main`;
- estado de `dev` consolidado mediante commits convencionales;
- pull request fusionada y rama remota eliminada;
- `main` local y `origin/main` alineados en `ceee87d`;
- el historial compartido de `dev` no fue reescrito;
- los controles de mensajes convencionales quedan vigentes para cambios futuros.

## Evidencia obtenida

### Repositorio e infraestructura

- arbol de trabajo limpio al iniciar la validacion;
- Compose productivo renderizado correctamente;
- topologia valida: solo Nginx publica un puerto;
- escaneo de secretos versionables sin hallazgos;
- `nginx -t` correcto;
- migraciones finalizadas con codigo `0`;
- PostgreSQL, Redis, backend y frontend saludables;
- PostgreSQL, Redis, backend y frontend sin puertos publicados;
- backend conectado como `gidas_app`, separado del usuario de migraciones.

### Backend

- 316 pruebas correctas dentro de Docker Linux;
- incluida la rotacion concurrente de refresh tokens;
- liveness y readiness respondieron `200` por el proxy;
- request ID y headers defensivos presentes.

La suite local de Windows presento un error durante el `tearDown` al eliminar un
SQLite todavia bloqueado. La prueba funcional habia concluido y el mismo caso paso
en Linux, por lo que no se considera una regresion del backend.

### Frontend

- 20 pruebas correctas;
- typecheck correcto;
- build productivo correcto en host y en Docker;
- bundle principal servido correctamente;
- `/` y `/administracion` respondieron `200` por Nginx.

## Calificacion temporal por HTTP

El archivo local `backend/.env.production` usa intencionalmente
`APP_ENV=staging`, modalidad documentada para validar por HTTP mientras no existe
TLS. Permite probar imagenes, migraciones, red, proxy y healthchecks, pero no es la
configuracion definitiva.

Por ese motivo el entrypoint selecciono el servidor de desarrollo de Flask y
registro su advertencia. Para el servidor real deben cumplirse simultaneamente:

- `APP_ENV=production`;
- Gunicorn como proceso backend;
- `DEBUG=False`;
- origenes CORS HTTPS exactos;
- cookies refresh `Secure`, `HttpOnly` y `SameSite`;
- HTTPS validado antes de activar HSTS.

No aprobar el servidor final si sus logs muestran Flask en lugar de Gunicorn.

## Hallazgos operativos conocidos

### Headers repetidos

Frontend y proxy aplican algunos headers defensivos equivalentes. La respuesta
local presento valores repetidos de `nosniff` y frame policy. No bloqueo el flujo,
pero debe comprobarse que el proxy definitivo no agregue valores contradictorios.

### Vite y esbuild en Windows

El entorno local restringido puede impedir que `esbuild` lea `vite.config.ts`.
Antes de atribuirlo al codigo se debe repetir el build con los permisos previstos
y dentro de Docker Linux. Ambos builds fueron correctos en esta validacion.

El watcher de Vite sobre bind mounts tampoco siempre refleja cambios del host.
Despues de cambios frontend se debe reiniciar solo `frontend`, esperar `healthy`,
consultar el modulo servido y probar por `5173` y por el proxy `8080`.

### Compatibilidad Windows/Linux

El test de formularios habia utilizado un separador exclusivo de Windows. Se
normalizo para aceptar `\\` y `/` y se agrego una regresion para ambos sistemas.
CI debe conservar Ubuntu como gate obligatorio.

## Bloqueo del workflow de commits

El job `Mensajes de commit` inspecciona todos los commits comprendidos entre la
base de la PR y `dev`.

Resultado equivalente ejecutado localmente:

- 208 commits incluidos;
- 63 asuntos no compatibles con Conventional Commits.

Existen mensajes historicos con tipos `feature` o `perfo`, mensajes sin tipo,
espacios iniciales y formatos incompletos. El squash elegido al mergear no evita
que el workflow falle mientras la PR permanece abierta.

No se recomienda reescribir directamente los 208 commits compartidos. Antes del
merge se debe elegir y documentar una estrategia:

1. crear una rama limpia desde `main` y consolidar el estado en commits validos;
2. permitir una excepcion controlada para esta integracion historica y mantener el
   gate estricto para cambios posteriores;
3. ajustar temporalmente el rango del workflow con aprobacion explicita.

## Checklist ejecutado para finalizar el merge

- referencias remotas actualizadas y base real de `main` confirmada;
- gate de mensajes historicos resuelto mediante rama limpia;
- pruebas backend, frontend, infraestructura y mensajes verificadas;
- diff revisado sin `.env`, claves ni certificados reales;
- PR fusionada y commit resultante registrado.

## Pull request integrada

Titulo propuesto:

```text
feat: consolidar arquitectura, seguridad y experiencia administrativa
```

La descripcion de la PR debe incluir:

- reorganizacion modular de frontend y backend;
- API versionada y contratos de errores seguros;
- seguridad de JWT, refresh, CORS, rate limiting y permisos;
- trazabilidad, memorias, busqueda y formularios;
- panel y navegacion administrativa;
- code splitting y mejoras de performance;
- Docker Compose, migraciones, healthchecks, Nginx y despliegue por SSH;
- seed y fixtures ficticios de testing;
- evidencia de 316 pruebas backend, 20 frontend, typecheck, builds, topologia,
  migraciones y smoke HTTP;
- aclaracion de que HTTPS, secretos finales y aceptacion de la VM se completan en
  el despliegue y no forman parte de la calificacion HTTP local.

## Informacion requerida de la VM

- distribucion y version de Linux;
- CPU, RAM y almacenamiento;
- usuario SSH, autenticacion y permisos `sudo`;
- IP fija o DNS definitivo;
- clientes o redes que accederan;
- puertos permitidos por firewall;
- disponibilidad de Docker Engine y Compose;
- directorio persistente de la aplicacion;
- mecanismo de entrega del repositorio o imagenes;
- politica de backups, retencion y almacenamiento externo;
- politica de logs y monitoreo;
- responsable, ventana de despliegue y contacto de rollback.

## Informacion requerida para HTTPS

- hostname incluido en el certificado;
- CA confiable para los clientes;
- certificado, cadena y clave fuera del repositorio;
- permisos restrictivos de la clave;
- terminacion TLS en Compose o proxy externo;
- responsable y mecanismo de renovacion;
- origen frontend HTTPS exacto;
- decision posterior sobre HSTS.

## Preparacion de configuracion y secretos

- generar secretos diferentes para Flask, access JWT y refresh JWT;
- renovar credenciales PostgreSQL administrativa y de aplicacion;
- conservar `MIGRATION_DATABASE_URL` separada de `DATABASE_URL`;
- definir issuer, audience y expiracion JWT;
- configurar archivos con permisos restrictivos o secretos montados;
- no reutilizar datos ni secretos del ambiente testing;
- validar Compose sin imprimir valores.

## Secuencia del despliegue

1. ejecutar preflight y validar topologia;
2. realizar backup si existe una base previa;
3. levantar con el archivo productivo real;
4. comprobar migraciones y healthchecks;
5. confirmar Gunicorn y usuario PostgreSQL limitado;
6. verificar que solo el proxy publique puertos;
7. probar login, primer acceso, refresh y logout por HTTPS;
8. probar CORS permitido y rechazado;
9. probar frontend, busqueda y panel administrativo;
10. ejecutar la purga de refresh primero con `--dry-run`;
11. programar backups, purga, renovacion TLS y monitoreo;
12. registrar version, operador, evidencia y rollback.

## Rollback

- conservar la referencia anterior de `main` y las imagenes;
- no ejecutar `docker compose down -v`;
- detener el despliegue si migraciones o readiness fallan;
- conservar logs antes de reintentar;
- restaurar base solamente desde un backup comprobado;
- usar el procedimiento documentado, no `git reset --hard`.

## Estado posterior al merge

- stack de testing levantado localmente;
- servicios saludables en `http://localhost:8080`;
- volumenes preservados;
- ninguna configuracion real de la VM aplicada;
- HTTPS y aceptacion del servidor pendientes.
