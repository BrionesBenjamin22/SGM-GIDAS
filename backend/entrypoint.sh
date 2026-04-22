#!/bin/sh

echo "Esperando a PostgreSQL..."

while ! python -c "
import os
import psycopg2
from urllib.parse import urlparse

db_url = os.getenv('DATABASE_URL')
if not db_url:
    raise Exception('DATABASE_URL no está definida')

url = urlparse(db_url)

conn = psycopg2.connect(
    dbname=url.path.lstrip('/'),
    user=url.username,
    password=url.password,
    host=url.hostname,
    port=url.port
)
conn.close()
"; do
  sleep 2
done

echo "PostgreSQL disponible"

echo "Aplicando migraciones..."
flask db upgrade

echo "Ejecutando seed inicial..."
python seed_roles.py

echo "Iniciando backend..."
exec flask run --host=0.0.0.0 --port=5000