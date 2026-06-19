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
- `POSTGRES_PASSWORD`
- `DATABASE_URL`

Las claves de aplicacion deben tener al menos 32 caracteres. El backend no inicia en produccion si conserva placeholders o configuracion insegura.

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
