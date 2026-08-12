# Despliegue en produccion con Nginx y Certbot

Esta guia deja el esquema recomendado para desplegar Sistema GIDAS en un servidor propio:

```text
Usuario -> HTTPS -> Nginx del servidor + Certbot -> http://127.0.0.1:8080 -> Nginx del compose -> frontend/backend
```

El compose de la aplicacion no gestiona certificados. Expone el proxy interno en `127.0.0.1:8080` o en el puerto definido por `NGINX_PORT`, y el Nginx del servidor publica HTTPS en los puertos 80 y 443.

## Requisitos

- Dominio o subdominio asignado a la aplicacion, por ejemplo `gidas.example.com`.
- Registro DNS `A` apuntando a la IP publica del servidor.
- Puertos 80 y 443 abiertos hacia el servidor.
- Docker y Docker Compose instalados.
- Nginx y Certbot instalados en el servidor.

## Variables de entorno

Crear los archivos reales desde las plantillas:

```bash
cp .env.production.example .env.production
cp backend/.env.production.example backend/.env.production
cp frontend/.env.production.example frontend/.env.production
```

En `.env.production`, dejar el proxy interno del compose en un puerto no privilegiado:

```env
NGINX_PORT=8080
```

En `backend/.env.production`, reemplazar `gidas.example.com` por el dominio real:

```env
FRONTEND_URL=https://gidas.example.com
FRONTEND_URLS=https://gidas.example.com
SESSION_COOKIE_SECURE=True
```

Tambien deben reemplazarse los placeholders de:

- `SECRET_KEY`
- `JWT_SECRET`
- `REFRESH_SECRET`
- `POSTGRES_ADMIN_PASSWORD`
- `POSTGRES_APP_PASSWORD`
- `DATABASE_URL`
- `MIGRATION_DATABASE_URL`

Las claves de aplicacion deben tener al menos 32 caracteres. El backend no inicia en produccion si conserva placeholders o configuracion insegura.

## Usuarios PostgreSQL

Produccion utiliza dos identidades independientes:

- `gidas_admin`: propietario inicial utilizado por PostgreSQL y por el servicio
  efimero `migrate` para roles, Alembic, seed y permisos.
- `gidas_app`: identidad permanente de Flask/Gunicorn, con DML sobre tablas y
  secuencias pero sin permisos para crear bases, roles, esquemas o tablas.

`.env.production` contiene las variables administrativas y no se versiona.
`backend/.env.production` contiene solamente `DATABASE_URL` de `gidas_app`; no
debe incluir `POSTGRES_ADMIN_PASSWORD` ni `MIGRATION_DATABASE_URL`.

Compose exige que `migrate` finalice correctamente antes de iniciar backend.
Las contrasenas deben ser distintas, aleatorias y almacenarse en el gestor de
secretos del servidor.

### Volumen existente

No elimine ni recree el volumen. Haga primero una copia verificada:

```bash
docker compose --env-file .env.production exec -T db pg_dump -U "$POSTGRES_ADMIN_USER" -d "$POSTGRES_DB" -Fc > gidas-before-role-split.dump
```

Complete las nuevas variables reales, actualice `DATABASE_URL` y ejecute:

```bash
docker compose --env-file .env.production run --rm migrate
docker compose --env-file .env.production up -d backend
```

Compruebe `SELECT current_user` desde el backend y verifique que una operacion
DML representativa funciona. Una sentencia `CREATE TABLE` ejecutada como
`gidas_app` debe ser rechazada. Si falla la validacion funcional, restaure
temporalmente la URL anterior; no restaure el dump sobre el volumen activo sin
una ventana y plan de recuperacion aprobados.

### Rotacion

Rote una identidad por vez. Para `gidas_app`, cambie su clave y `DATABASE_URL`,
ejecute `migrate` y reinicie backend. Para `gidas_admin`, cambie primero la clave
en PostgreSQL y luego actualice `POSTGRES_ADMIN_PASSWORD` y
`MIGRATION_DATABASE_URL`. Valide healthcheck, login y escritura después de cada
rotacion.

## Levantar la aplicacion

Desde la raiz del proyecto:

```bash
docker compose --env-file .env.production up --build -d
```

Verificar estado:

```bash
docker compose --env-file .env.production ps
```

La aplicacion debe responder internamente en:

```text
http://127.0.0.1:8080
```

## Configurar Nginx externo

Copiar la plantilla:

```bash
sudo cp nginx/gidas.external.conf.example /etc/nginx/sites-available/gidas
```

Editar el dominio:

```bash
sudo nano /etc/nginx/sites-available/gidas
```

Reemplazar:

```text
gidas.example.com
```

por el dominio real.

Activar el sitio:

```bash
sudo ln -s /etc/nginx/sites-available/gidas /etc/nginx/sites-enabled/gidas
sudo nginx -t
sudo systemctl reload nginx
```

## Solicitar certificado

Con DNS ya propagado:

```bash
sudo certbot --nginx -d gidas.example.com
```

Certbot detecta el bloque de Nginx, agrega la configuracion TLS y puede configurar redireccion automatica de HTTP a HTTPS.

## Verificar renovacion

```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

## Operacion

### Logs y estado operativo

En produccion el backend emite JSON por `stdout`. Cada evento incluye servicio,
entorno, version, nivel y, durante solicitudes, `request_id`, ruta, usuario y
rol. Nginx propaga `X-Request-ID`; el backend lo devuelve al cliente para poder
correlacionar un error reportado con los logs.

Configure `APP_VERSION` con el tag o hash desplegado. Compose limita cada archivo
de log a `LOG_MAX_SIZE` y conserva `LOG_MAX_FILES`; los valores iniciales son
`10m` y `5`.

Endpoints operativos:

- `/api/v1/health/live`: confirma que el proceso responde, sin consultar dependencias.
- `/api/v1/health/ready`: verifica PostgreSQL y Redis; responde 503 si alguno falla.
- `/api/v1/health`: alias compatible de liveness.

Diagnostico recomendado:

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=200 backend nginx db redis
curl -i http://127.0.0.1:8080/api/v1/health/live
curl -i http://127.0.0.1:8080/api/v1/health/ready
```

Esta base permite incorporar posteriormente un colector compatible con logs
JSON, Loki u OpenTelemetry sin cambiar el contrato funcional de la API.

Ver logs del proxy externo:

```bash
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

Ver logs del backend:

```bash
docker compose --env-file .env.production logs -f backend
```

Ver healthcheck por HTTPS:

```bash
curl -i https://gidas.example.com/api/v1/health
```

## Notas de seguridad

- No exponer PostgreSQL a internet.
- No exponer Redis a internet.
- No exponer directamente el backend Flask/Gunicorn.
- Publicar solo Nginx del servidor en 80 y 443.
- Mantener `FRONTEND_URLS` restringido al dominio real.
- No versionar archivos `.env` reales.
