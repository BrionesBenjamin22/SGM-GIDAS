from modules.shared.services.auditoria_service import AuditoriaService


class CatalogoAuditoriaService:
    @staticmethod
    def entidad(model_or_instance) -> str:
        table = getattr(model_or_instance, "__tablename__", None)
        if table:
            return table

        table = getattr(model_or_instance.__class__, "__tablename__", None)
        return table or model_or_instance.__class__.__name__

    @staticmethod
    def construir_cambios(registro, valores: dict):
        cambios = {}
        for campo, valor_nuevo in valores.items():
            if not hasattr(registro, campo):
                continue

            cambio = AuditoriaService.construir_cambio(
                getattr(registro, campo),
                valor_nuevo
            )
            if cambio:
                cambios[campo] = cambio

        return cambios

    @staticmethod
    def registrar_cambios(registro, cambios: dict, user_id: int | None = None):
        if not cambios:
            return

        AuditoriaService.registrar_cambios(
            CatalogoAuditoriaService.entidad(registro),
            registro.id,
            cambios,
            user_id=user_id
        )

    @staticmethod
    def marcar_creacion(registro, user_id: int | None = None):
        if user_id is not None and hasattr(registro, "created_by"):
            registro.created_by = user_id

    @staticmethod
    def marcar_actualizacion(
        registro,
        cambios: dict,
        user_id: int | None = None
    ):
        if not cambios:
            return

        if hasattr(registro, "mark_updated"):
            registro.mark_updated(user_id)

        CatalogoAuditoriaService.registrar_cambios(
            registro,
            cambios,
            user_id=user_id
        )

    @staticmethod
    def marcar_baja(registro, user_id: int | None = None):
        if hasattr(registro, "soft_delete"):
            cambios = {
                "activo": AuditoriaService.construir_cambio(
                    getattr(registro, "activo", None),
                    False
                )
            }
            registro.soft_delete(user_id)
            CatalogoAuditoriaService.registrar_cambios(
                registro,
                cambios,
                user_id=user_id
            )
            CatalogoAuditoriaService.registrar_accion(
                registro,
                "inactivar",
                user_id=user_id
            )
            return

        CatalogoAuditoriaService.registrar_accion(
            registro,
            "eliminar",
            user_id=user_id
        )

    @staticmethod
    def registrar_accion(
        registro,
        accion: str,
        user_id: int | None = None,
        detalle: dict | None = None
    ):
        AuditoriaService.registrar_evento_relacion(
            CatalogoAuditoriaService.entidad(registro),
            registro.id,
            "accion_sistema",
            accion,
            detalle or {},
            user_id=user_id
        )

    @staticmethod
    def historial(registro):
        return AuditoriaService.obtener_historial_entidad(
            CatalogoAuditoriaService.entidad(registro),
            registro.id
        )

    @staticmethod
    def historial_por_modelo(modelo, registro_id: int):
        registro = modelo.query.get(registro_id)
        if not registro:
            raise ValueError("Catalogo no encontrado")
        return CatalogoAuditoriaService.historial(registro)
