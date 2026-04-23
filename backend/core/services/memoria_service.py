from datetime import datetime

from extension import db
from core.models.memorias import Memoria, MemoriaVersion, EstadoMemoria


class MemoriaService:

    # ==========================================
    # HELPERS
    # ==========================================

    @staticmethod
    def _validar_payload(data: dict):
        if not isinstance(data, dict) or not data:
            raise ValueError("Los datos no pueden estar vacios")

    @staticmethod
    def _validar_id(valor, campo: str):
        if not isinstance(valor, int) or valor <= 0:
            raise ValueError(f"El campo '{campo}' debe ser un entero positivo")
        return valor

    @staticmethod
    def _validar_texto(valor: str, campo: str):
        if not isinstance(valor, str) or not valor.strip():
            raise ValueError(f"El campo '{campo}' es obligatorio")
        return valor.strip()

    @staticmethod
    def _validar_fecha(fecha_str: str, campo: str):
        valor = MemoriaService._validar_texto(fecha_str, campo)

        try:
            return datetime.strptime(valor, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError(
                f"El campo '{campo}' debe tener formato YYYY-MM-DD"
            )

    @staticmethod
    def _validar_periodos(periodo_inicio, periodo_fin):
        fecha_inicio = MemoriaService._validar_fecha(
            periodo_inicio, "periodo_inicio"
        )
        fecha_fin = MemoriaService._validar_fecha(
            periodo_fin, "periodo_fin"
        )

        if fecha_inicio > fecha_fin:
            raise ValueError(
                "La fecha de inicio del periodo no puede ser mayor a la fecha de fin"
            )

        return fecha_inicio, fecha_fin

    @staticmethod
    def _resolver_fecha_apertura(fecha_apertura):
        # Se admite que la fecha de apertura llegue desde el usuario, pero si
        # no se informa usamos el instante actual para no bloquear el alta.
        if fecha_apertura in (None, ""):
            return datetime.utcnow()

        if isinstance(fecha_apertura, datetime):
            return fecha_apertura

        if isinstance(fecha_apertura, str):
            valor = fecha_apertura.strip()

            for formato in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
                try:
                    return datetime.strptime(valor, formato)
                except ValueError:
                    pass

            try:
                return datetime.combine(
                    datetime.strptime(valor, "%Y-%m-%d").date(),
                    datetime.min.time()
                )
            except ValueError:
                pass

        raise ValueError(
            "La fecha_apertura debe tener formato YYYY-MM-DD o YYYY-MM-DD HH:MM:SS"
        )

    @staticmethod
    def _resolver_fecha_evento(fecha_evento, campo: str):
        # Unifica el parseo de fechas datetime que marcan transiciones para que
        # cerrar y reabrir mantengan el mismo criterio de entrada.
        if fecha_evento in (None, ""):
            return datetime.utcnow()

        if isinstance(fecha_evento, datetime):
            return fecha_evento

        if isinstance(fecha_evento, str):
            valor = fecha_evento.strip()

            for formato in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
                try:
                    return datetime.strptime(valor, formato)
                except ValueError:
                    pass

            try:
                return datetime.combine(
                    datetime.strptime(valor, "%Y-%m-%d").date(),
                    datetime.min.time()
                )
            except ValueError:
                pass

        raise ValueError(
            f"El campo '{campo}' debe tener formato YYYY-MM-DD o YYYY-MM-DD HH:MM:SS"
        )

    @staticmethod
    def _validar_estado(estado):
        if isinstance(estado, EstadoMemoria):
            return estado

        if isinstance(estado, str):
            valor = estado.strip().lower()
            for estado_enum in EstadoMemoria:
                if estado_enum.value == valor:
                    return estado_enum

        raise ValueError(
            "El estado debe ser 'abierta', 'en revision' o 'cerrada'"
        )

    @staticmethod
    def _get_memoria_or_404(memoria_id: int):
        memoria = db.session.get(
            Memoria,
            MemoriaService._validar_id(memoria_id, "memoria_id")
        )
        if not memoria or memoria.deleted_at is not None:
            raise Exception("Memoria no encontrada")
        return memoria

    @staticmethod
    def _get_version_actual_or_404(memoria: Memoria):
        if not memoria.version_actual or memoria.version_actual.deleted_at is not None:
            raise ValueError("La memoria no tiene una version actual valida")
        return memoria.version_actual

    @staticmethod
    def _validar_transicion_estado(estado_actual: EstadoMemoria, nuevo_estado: EstadoMemoria):
        transiciones_validas = {
            EstadoMemoria.ABIERTA: {
                EstadoMemoria.EN_REVISION,
                EstadoMemoria.CERRADA
            },
            EstadoMemoria.EN_REVISION: {
                EstadoMemoria.ABIERTA,
                EstadoMemoria.CERRADA
            },
            EstadoMemoria.CERRADA: set()
        }

        if nuevo_estado == estado_actual:
            raise ValueError("La memoria ya se encuentra en ese estado")

        if nuevo_estado not in transiciones_validas[estado_actual]:
            raise ValueError(
                f"No se puede cambiar el estado de '{estado_actual.value}' a '{nuevo_estado.value}'"
            )

    @staticmethod
    def _obtener_siguiente_numero_version(memoria: Memoria):
        if not memoria.versiones:
            return 1
        return max(version.numero_version for version in memoria.versiones) + 1

    @staticmethod
    def _crear_version_inicial(memoria: Memoria, user_id: int, fecha_apertura=None):
        # La memoria nace con una version activa para que el resto de la capa
        # de negocio siempre trabaje contra una "memoria viva" bien definida.
        version = MemoriaVersion(
            numero_version=1,
            fecha_apertura=MemoriaService._resolver_fecha_apertura(fecha_apertura),
            fecha_cierre=None,
            estado=EstadoMemoria.ABIERTA,
            memoria=memoria,
            created_by=user_id
        )
        db.session.add(version)
        db.session.flush()
        memoria.version_actual_id = version.id
        return version

    # ==========================================
    # GET ALL
    # ==========================================

    @staticmethod
    def get_all(activos: str = "true"):
        query = Memoria.query

        if activos == "true":
            query = query.filter(Memoria.deleted_at.is_(None))
        elif activos == "false":
            query = query.filter(Memoria.deleted_at.isnot(None))
        elif activos == "all":
            pass
        else:
            query = query.filter(Memoria.deleted_at.is_(None))

        memorias = query.order_by(Memoria.id.desc()).all()
        return [memoria.serialize() for memoria in memorias]

    # ==========================================
    # GET BY ID
    # ==========================================

    @staticmethod
    def get_by_id(memoria_id: int):
        memoria = db.session.get(
            Memoria,
            MemoriaService._validar_id(memoria_id, "memoria_id")
        )
        if not memoria:
            raise Exception("Memoria no encontrada")
        return memoria.serialize()

    # ==========================================
    # CREATE
    # ==========================================

    @staticmethod
    def create(data: dict, user_id: int):
        MemoriaService._validar_payload(data)
        MemoriaService._validar_id(user_id, "user_id")
        periodo_inicio, periodo_fin = MemoriaService._validar_periodos(
            data.get("periodo_inicio"),
            data.get("periodo_fin")
        )

        memoria = Memoria(
            periodo_inicio=periodo_inicio,
            periodo_fin=periodo_fin,
            created_by=user_id
        )

        db.session.add(memoria)
        db.session.flush()

        MemoriaService._crear_version_inicial(
            memoria,
            user_id,
            data.get("fecha_apertura")
        )

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return memoria.serialize()

    # ==========================================
    # UPDATE
    # ==========================================

    @staticmethod
    def update(memoria_id: int, data: dict):
        MemoriaService._validar_id(memoria_id, "memoria_id")
        MemoriaService._validar_payload(data)

        # La memoria raiz representa la identidad del expediente/versionado.
        # Una vez creada no se modifica; cualquier evolucion se resuelve en la
        # capa de versionado y transicion de estados.
        raise ValueError("La memoria no puede modificarse una vez creada")

    # ==========================================
    # SOFT DELETE
    # ==========================================

    @staticmethod
    def delete(memoria_id: int, user_id: int):
        MemoriaService._validar_id(user_id, "user_id")
        memoria = MemoriaService._get_memoria_or_404(memoria_id)

        # El borrado sigue la estrategia general del sistema: se marca como
        # inactiva para preservar trazabilidad y no perder referencias.
        memoria.soft_delete(user_id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Memoria eliminada correctamente"}

    # ==========================================
    # CAMBIAR ESTADO
    # ==========================================

    @staticmethod
    def change_status(memoria_id: int, data: dict):
        MemoriaService._validar_payload(data)
        memoria = MemoriaService._get_memoria_or_404(memoria_id)
        version_actual = MemoriaService._get_version_actual_or_404(memoria)
        nuevo_estado = MemoriaService._validar_estado(data.get("estado"))

        MemoriaService._validar_transicion_estado(
            version_actual.estado,
            nuevo_estado
        )

        # Mientras la version siga viva, solo muta su estado. La unica salida
        # definitiva de la version actual es el estado cerrada.
        version_actual.estado = nuevo_estado

        if nuevo_estado == EstadoMemoria.CERRADA:
            version_actual.fecha_cierre = MemoriaService._resolver_fecha_evento(
                data.get("fecha_cierre"),
                "fecha_cierre"
            )
        else:
            version_actual.fecha_cierre = None

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return memoria.serialize()

    # ==========================================
    # REABRIR (NUEVA VERSION)
    # ==========================================

    @staticmethod
    def reopen(memoria_id: int, user_id: int, data: dict | None = None):
        MemoriaService._validar_id(user_id, "user_id")
        memoria = MemoriaService._get_memoria_or_404(memoria_id)
        version_actual = MemoriaService._get_version_actual_or_404(memoria)
        data = data or {}

        if version_actual.estado != EstadoMemoria.CERRADA:
            raise ValueError(
                "Solo se puede crear una nueva version a partir de una memoria cerrada"
            )

        # Reabrir no muta la version historica cerrada: crea una nueva version
        # editable y la convierte en la version actual de la memoria.
        nueva_version = MemoriaVersion(
            numero_version=MemoriaService._obtener_siguiente_numero_version(memoria),
            fecha_apertura=MemoriaService._resolver_fecha_apertura(
                data.get("fecha_apertura")
            ),
            fecha_cierre=None,
            estado=EstadoMemoria.ABIERTA,
            memoria=memoria,
            created_by=user_id
        )

        db.session.add(nueva_version)
        db.session.flush()
        memoria.version_actual_id = nueva_version.id

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return memoria.serialize()
