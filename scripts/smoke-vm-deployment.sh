#!/bin/sh
set -eu

ENV_FILE="${1:-.env.production}"
BASE_URL="${2:-}"

for command_name in docker curl; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
        echo "ERROR: falta el comando requerido $command_name" >&2
        exit 1
    fi
done

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: falta el archivo de entorno $ENV_FILE" >&2
    exit 1
fi

if [ -z "$BASE_URL" ]; then
    NGINX_PORT="$(sed -n 's/^NGINX_PORT=//p' "$ENV_FILE" | tail -n 1)"
    NGINX_PORT="${NGINX_PORT:-8080}"
    BASE_URL="http://127.0.0.1:$NGINX_PORT"
fi

MIGRATE_ID="$(docker compose --env-file "$ENV_FILE" ps -aq migrate)"
if [ -z "$MIGRATE_ID" ]; then
    echo "ERROR: no existe el contenedor de migraciones" >&2
    exit 1
fi

MIGRATE_EXIT="$(docker inspect --format '{{.State.ExitCode}}' "$MIGRATE_ID")"
if [ "$MIGRATE_EXIT" != "0" ]; then
    echo "ERROR: migrate termino con codigo $MIGRATE_EXIT" >&2
    exit 1
fi

curl --fail --silent --show-error "$BASE_URL/api/v1/health/live" >/dev/null
curl --fail --silent --show-error "$BASE_URL/api/v1/health/ready" >/dev/null
curl --fail --silent --show-error "$BASE_URL/" >/dev/null

echo "Smoke test correcto: migrate=0, liveness, readiness y frontend disponibles."
