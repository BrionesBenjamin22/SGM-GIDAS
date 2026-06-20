from datetime import date, datetime
from enum import Enum

from extension import db
from modules.shared.models.auditoria_campo import AuditoriaCampo


class AuditoriaService:

    @staticmethod
    def _normalizar_valor(valor):
        if isinstance(valor, (datetime, date)):
            return valor.isoformat()

        if isinstance(valor, Enum):
            return valor.value

        return valor

    @staticmethod
    def construir_cambio(valor_anterior, valor_nuevo):
        valor_anterior = AuditoriaService._normalizar_valor(valor_anterior)
        valor_nuevo = AuditoriaService._normalizar_valor(valor_nuevo)

        if valor_anterior == valor_nuevo:
            return None

        return {
            "valor_anterior": valor_anterior,
            "valor_nuevo": valor_nuevo
        }

    @staticmethod
    def registrar_cambios(
        entidad: str,
        registro_id: int,
        cambios: dict,
        user_id: int | None = None,
        memoria_id: int | None = None,
        memoria_version_id: int | None = None
    ):
        # Recibe solo los campos que ya cambiaron y persiste una fila por
        # atributo para facilitar filtros y trazabilidad fina.
        for campo, valores in cambios.items():
            if not valores:
                continue

            auditoria = AuditoriaCampo(
                entidad=entidad,
                registro_id=registro_id,
                campo=campo,
                valor_anterior=valores.get("valor_anterior"),
                valor_nuevo=valores.get("valor_nuevo"),
                usuario_id=user_id,
                memoria_id=memoria_id,
                memoria_version_id=memoria_version_id
            )
            db.session.add(auditoria)

    @staticmethod
    def registrar_evento_relacion(
        entidad: str,
        registro_id: int,
        relacion: str,
        accion: str,
        detalle: dict,
        user_id: int | None = None,
        memoria_id: int | None = None,
        memoria_version_id: int | None = None
    ):
        # Registra altas y bajas de asociaciones con un payload compacto
        # para reconstruir el contexto del vínculo.
        auditoria = AuditoriaCampo(
            entidad=entidad,
            registro_id=registro_id,
            campo=relacion,
            valor_anterior=None,
            valor_nuevo={
                "accion": accion,
                "detalle": {
                    clave: AuditoriaService._normalizar_valor(valor)
                    for clave, valor in (detalle or {}).items()
                }
            },
            usuario_id=user_id,
            memoria_id=memoria_id,
            memoria_version_id=memoria_version_id
        )
        db.session.add(auditoria)

    @staticmethod
    def obtener_historial_entidad(entidad: str, registro_id: int):
        historial = (
            AuditoriaCampo.query
            .filter(
                AuditoriaCampo.entidad == entidad,
                AuditoriaCampo.registro_id == registro_id
            )
            .order_by(
                AuditoriaCampo.fecha_cambio.desc(),
                AuditoriaCampo.id.desc()
            )
            .all()
        )
        return [item.serialize() for item in historial]
