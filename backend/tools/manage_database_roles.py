"""Gestion idempotente del rol PostgreSQL usado por la aplicacion."""

import os
import sys

import psycopg2
from psycopg2 import sql


def required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} es obligatoria")
    return value


def connection():
    return psycopg2.connect(required("DATABASE_URL"))


def prepare() -> None:
    app_user = required("POSTGRES_APP_USER")
    app_password = required("POSTGRES_APP_PASSWORD")
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (app_user,))
        command = "ALTER ROLE" if cursor.fetchone() else "CREATE ROLE"
        cursor.execute(
            sql.SQL(command + " {} WITH LOGIN PASSWORD %s NOSUPERUSER NOCREATEDB "
                    "NOCREATEROLE NOREPLICATION").format(sql.Identifier(app_user)),
            (app_password,),
        )


def grant() -> None:
    app_user = required("POSTGRES_APP_USER")
    database = required("POSTGRES_DB")
    role = sql.Identifier(app_user)
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute(sql.SQL("GRANT CONNECT ON DATABASE {} TO {}").format(sql.Identifier(database), role))
        cursor.execute(sql.SQL("GRANT USAGE ON SCHEMA public TO {}").format(role))
        cursor.execute(sql.SQL("REVOKE CREATE ON SCHEMA public FROM {}").format(role))
        cursor.execute(sql.SQL("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {}").format(role))
        cursor.execute(sql.SQL("GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO {}").format(role))
        cursor.execute(sql.SQL("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {}").format(role))
        cursor.execute(sql.SQL("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO {}").format(role))


if __name__ == "__main__":
    actions = {"prepare": prepare, "grant": grant}
    if len(sys.argv) != 2 or sys.argv[1] not in actions:
        raise SystemExit("Uso: manage_database_roles.py prepare|grant")
    actions[sys.argv[1]]()
