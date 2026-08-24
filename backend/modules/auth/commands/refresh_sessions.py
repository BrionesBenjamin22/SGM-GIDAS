import click
from flask import Flask

from modules.auth.services.refresh_session_cleanup_service import RefreshSessionCleanupService


def register_refresh_session_commands(app: Flask) -> None:
    auth_cli = click.Group("auth", help="Operaciones seguras de autenticacion.")

    @auth_cli.command("purge-refresh-sessions")
    @click.option("--dry-run", is_flag=True, help="Informa el alcance sin eliminar sesiones.")
    def purge_refresh_sessions(dry_run: bool) -> None:
        count = RefreshSessionCleanupService.purge(
            retention_days=app.config["REFRESH_SESSION_RETENTION_DAYS"],
            dry_run=dry_run,
        )
        action = "alcanzadas" if dry_run else "eliminadas"
        click.echo(f"Sesiones de refresh {action}: {count}")

    app.cli.add_command(auth_cli)
