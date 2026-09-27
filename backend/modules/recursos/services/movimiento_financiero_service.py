"""Operaciones de dominio para los movimientos financieros del grupo."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from extension import db
from modules.memorias.services.memoria_periodo_service import (
    consultar_entidades_memoria, registro_puntual_en_memoria,
)
from modules.catalogos.models.fuente_financiamiento import FuenteFinanciamiento
from modules.grupo.models.grupo import GrupoInvestigacionUtn
from modules.recursos.models.movimiento_financiero import (
    CategoriaErogacion, MovimientoFinanciero, MovimientoMemoriaVersion,
    validar_monto_financiero,
)
from modules.recursos.services.saldo_financiero_service import SaldoFinancieroService
from modules.shared.exceptions import ConflictError, NotFoundError, ValidationError
from modules.shared.services.auditoria_service import AuditoriaService
from modules.shared.services.date_time import validate_institutional_date


class MovimientoFinancieroService:
    _CAMPOS_ALTA = frozenset({
        "grupo_utn_id", "fecha", "tipo_movimiento", "monto",
        "fuente_financiamiento_id", "categoria_erogacion_id",
    })
    _CAMPOS_EDICION = frozenset({
        "fecha", "monto", "fuente_financiamiento_id", "categoria_erogacion_id",
    })

    @staticmethod
    def _id_positivo(value, field):
        if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
            raise ValidationError(
                "Revise los campos indicados e intente nuevamente.",
                details={"fields": {field: "Seleccione un valor válido."}},
            )
        return value

    @staticmethod
    def _fecha(value):
        try:
            fecha = datetime.strptime(value, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            raise ValidationError(
                "Revise los campos indicados e intente nuevamente.",
                details={"fields": {"fecha": "Ingrese una fecha válida."}},
            ) from None
        validate_institutional_date(fecha, allow_future=False)
        return fecha

    @staticmethod
    def _bloquear_grupo(grupo_id: int):
        grupo = db.session.execute(
            select(GrupoInvestigacionUtn.id)
            .where(
                GrupoInvestigacionUtn.id == grupo_id,
                GrupoInvestigacionUtn.deleted_at.is_(None),
            )
            .with_for_update()
        ).scalar_one_or_none()
        if grupo is None:
            raise NotFoundError(
                "El grupo ya no está disponible. Recargue el formulario e intente nuevamente."
            )

    @staticmethod
    def get_all(filters: dict | None = None):
        filters = filters or {}
        query = select(MovimientoFinanciero).options(
            joinedload(MovimientoFinanciero.grupo_utn),
            joinedload(MovimientoFinanciero.fuente_financiamiento),
            joinedload(MovimientoFinanciero.categoria_erogacion),
        )
        activos = filters.get("activos", "true")
        if activos == "true":
            query = query.where(MovimientoFinanciero.deleted_at.is_(None))
        elif activos == "false":
            query = query.where(MovimientoFinanciero.deleted_at.is_not(None))
        elif activos != "all":
            raise ValidationError("El filtro de estado no es válido.")
        if filters.get("grupo_utn_id"):
            try:
                parsed_grupo_id = int(filters["grupo_utn_id"])
            except (TypeError, ValueError):
                raise ValidationError("El grupo indicado no es válido.") from None
            grupo_id = MovimientoFinancieroService._id_positivo(
                parsed_grupo_id, "grupo_utn_id"
            )
            query = query.where(MovimientoFinanciero.grupo_utn_id == grupo_id)
        query = query.order_by(
            MovimientoFinanciero.fecha.desc(),
            MovimientoFinanciero.numero_movimiento.desc(),
        )
        return [item.serialize() for item in db.session.scalars(query).unique().all()]

    @staticmethod
    def get_by_id(movimiento_id: int):
        MovimientoFinancieroService._id_positivo(movimiento_id, "id")
        movimiento = db.session.get(MovimientoFinanciero, movimiento_id)
        if not movimiento:
            raise NotFoundError("Movimiento no encontrado.")
        return movimiento.serialize()

    @staticmethod
    def get_historial(movimiento_id: int):
        MovimientoFinancieroService.get_by_id(movimiento_id)
        return AuditoriaService.obtener_historial_entidad(
            entidad="movimiento_financiero", registro_id=movimiento_id,
        )

    @staticmethod
    def create(data: dict, user_id: int):
        if not isinstance(data, dict) or not data:
            raise ValidationError("Envíe los datos del movimiento e intente nuevamente.")
        if data.keys() - MovimientoFinancieroService._CAMPOS_ALTA:
            raise ValidationError("El movimiento contiene campos que no se pueden cargar.")

        grupo_id = MovimientoFinancieroService._id_positivo(
            data.get("grupo_utn_id"), "grupo_utn_id"
        )
        tipo = data.get("tipo_movimiento")
        if tipo not in {"INGRESO", "EGRESO"}:
            raise ValidationError(
                "Revise los campos indicados e intente nuevamente.",
                details={"fields": {"tipo_movimiento": "Seleccione ingreso o egreso."}},
            )
        fecha = MovimientoFinancieroService._fecha(data.get("fecha"))
        # El modelo valida precisión y positividad antes de iniciar la escritura.
        movimiento = MovimientoFinanciero(
            grupo_utn_id=grupo_id,
            tipo_movimiento=tipo,
            monto=data.get("monto"),
            moneda="ARS",
            fecha=fecha,
            created_by=user_id,
        )

        fuente_id = data.get("fuente_financiamiento_id")
        categoria_id = data.get("categoria_erogacion_id")
        if tipo == "INGRESO":
            if categoria_id is not None:
                raise ValidationError(
                    "Un ingreso no debe incluir una categoría de erogación.",
                    details={"fields": {"categoria_erogacion_id": "Quite la categoría."}},
                )
            fuente_id = MovimientoFinancieroService._id_positivo(
                fuente_id, "fuente_financiamiento_id"
            )
            fuente = db.session.get(FuenteFinanciamiento, fuente_id)
            if not fuente or fuente.deleted_at is not None:
                raise NotFoundError("La fuente ya no está disponible. Elija otra e intente nuevamente.")
            movimiento.fuente_financiamiento_id = fuente.id
        else:
            if fuente_id is not None:
                raise ValidationError(
                    "Un egreso no debe incluir una fuente de financiamiento.",
                    details={"fields": {"fuente_financiamiento_id": "Quite la fuente."}},
                )
            categoria_id = MovimientoFinancieroService._id_positivo(
                categoria_id, "categoria_erogacion_id"
            )
            categoria = db.session.get(CategoriaErogacion, categoria_id)
            if not categoria or categoria.deleted_at is not None:
                raise NotFoundError("La categoría ya no está disponible. Elija otra e intente nuevamente.")
            movimiento.categoria_erogacion_id = categoria.id

        # El bloqueo del grupo serializa numeración y comprobación del saldo.
        MovimientoFinancieroService._bloquear_grupo(grupo_id)
        if tipo == "EGRESO":
            saldo = SaldoFinancieroService.calcular(grupo_id).saldo_disponible
            if movimiento.monto > saldo:
                raise ConflictError(
                    "El saldo disponible no alcanza para registrar el egreso.",
                    details={"fields": {"monto": "Ingrese un monto igual o menor al saldo disponible."}},
                )

        ultimo = db.session.scalar(
            select(func.max(MovimientoFinanciero.numero_movimiento)).where(
                MovimientoFinanciero.grupo_utn_id == grupo_id
            )
        )
        movimiento.numero_movimiento = (ultimo or 0) + 1
        db.session.add(movimiento)
        db.session.commit()
        return movimiento.serialize()

    @staticmethod
    def update(movimiento_id: int, data: dict, user_id: int):
        MovimientoFinancieroService._id_positivo(movimiento_id, "id")
        if not isinstance(data, dict) or not data:
            raise ValidationError("Envíe los cambios del movimiento e intente nuevamente.")
        if data.keys() - MovimientoFinancieroService._CAMPOS_EDICION:
            raise ValidationError(
                "El tipo, la moneda, el grupo y el número de movimiento no pueden modificarse."
            )
        movimiento = db.session.get(MovimientoFinanciero, movimiento_id)
        if not movimiento or movimiento.deleted_at is not None:
            raise NotFoundError("Movimiento no encontrado.")
        MovimientoFinancieroService._bloquear_grupo(movimiento.grupo_utn_id)
        db.session.refresh(movimiento)
        if movimiento.deleted_at is not None:
            raise NotFoundError("Movimiento no encontrado.")

        nuevos = {}
        if "fecha" in data:
            nuevos["fecha"] = MovimientoFinancieroService._fecha(data["fecha"])
        if "monto" in data:
            nuevos["monto"] = validar_monto_financiero(data["monto"])
        if "fuente_financiamiento_id" in data:
            if movimiento.tipo_movimiento != "INGRESO":
                raise ValidationError("Un egreso no puede tener fuente de financiamiento.")
            fuente_id = MovimientoFinancieroService._id_positivo(
                data["fuente_financiamiento_id"], "fuente_financiamiento_id"
            )
            fuente = db.session.get(FuenteFinanciamiento, fuente_id)
            if not fuente or fuente.deleted_at is not None:
                raise NotFoundError("La fuente ya no está disponible. Elija otra e intente nuevamente.")
            nuevos["fuente_financiamiento_id"] = fuente.id
        if "categoria_erogacion_id" in data:
            if movimiento.tipo_movimiento != "EGRESO":
                raise ValidationError("Un ingreso no puede tener categoría de erogación.")
            categoria_id = MovimientoFinancieroService._id_positivo(
                data["categoria_erogacion_id"], "categoria_erogacion_id"
            )
            categoria = db.session.get(CategoriaErogacion, categoria_id)
            if not categoria or categoria.deleted_at is not None:
                raise NotFoundError("La categoría ya no está disponible. Elija otra e intente nuevamente.")
            nuevos["categoria_erogacion_id"] = categoria.id

        nuevo_monto = nuevos.get("monto", movimiento.monto)
        if nuevo_monto != movimiento.monto:
            saldo = SaldoFinancieroService.calcular(movimiento.grupo_utn_id).saldo_disponible
            if movimiento.tipo_movimiento == "EGRESO":
                saldo_resultante = saldo + movimiento.monto - nuevo_monto
            else:
                saldo_resultante = saldo - movimiento.monto + nuevo_monto
            if saldo_resultante < 0:
                raise ConflictError(
                    "El cambio dejaría al grupo sin saldo suficiente.",
                    details={"fields": {"monto": "El monto supera el saldo disponible."}},
                )

        cambios = {}
        for campo, nuevo_valor in nuevos.items():
            anterior = getattr(movimiento, campo)
            cambio = AuditoriaService.construir_cambio(
                str(anterior) if campo == "monto" else anterior,
                str(nuevo_valor) if campo == "monto" else nuevo_valor,
            )
            if cambio:
                cambios[campo] = cambio
                setattr(movimiento, campo, nuevo_valor)
        if cambios:
            movimiento.mark_updated(user_id)
            AuditoriaService.registrar_cambios(
                entidad="movimiento_financiero", registro_id=movimiento.id,
                cambios=cambios, user_id=user_id,
            )
            db.session.commit()
        return movimiento.serialize()

    @staticmethod
    def delete(movimiento_id: int, user_id: int):
        MovimientoFinancieroService._id_positivo(movimiento_id, "id")
        movimiento = db.session.get(MovimientoFinanciero, movimiento_id)
        if not movimiento or movimiento.deleted_at is not None:
            raise NotFoundError("Movimiento no encontrado.")
        MovimientoFinancieroService._bloquear_grupo(movimiento.grupo_utn_id)
        db.session.refresh(movimiento)
        if movimiento.deleted_at is not None:
            raise NotFoundError("Movimiento no encontrado.")
        if movimiento.tipo_movimiento == "INGRESO":
            saldo = SaldoFinancieroService.calcular(movimiento.grupo_utn_id).saldo_disponible
            if saldo - movimiento.monto < 0:
                raise ConflictError(
                    "No se puede eliminar el ingreso porque el saldo resultante sería negativo."
                )
        movimiento.soft_delete(user_id)
        db.session.commit()
        return {"message": "Movimiento eliminado correctamente."}

    @staticmethod
    def snapshot_para_memoria_version(memoria_version, user_id: int):
        movimientos = consultar_entidades_memoria(MovimientoFinanciero, memoria_version)
        snapshots = []
        for movimiento in movimientos:
            if not registro_puntual_en_memoria(
                memoria_version, movimiento, movimiento.fecha,
            ):
                continue
            snapshot = MovimientoMemoriaVersion(
                memoria_version_id=memoria_version.id,
                movimiento_id=movimiento.id,
                numero_movimiento=movimiento.numero_movimiento,
                fecha=movimiento.fecha,
                tipo_movimiento=movimiento.tipo_movimiento,
                monto=movimiento.monto,
                moneda=movimiento.moneda,
                fuente_financiamiento_id=movimiento.fuente_financiamiento_id,
                fuente_financiamiento_nombre=(
                    movimiento.fuente_financiamiento.nombre
                    if movimiento.fuente_financiamiento else None
                ),
                categoria_erogacion_id=movimiento.categoria_erogacion_id,
                categoria_erogacion_codigo=(
                    movimiento.categoria_erogacion.codigo
                    if movimiento.categoria_erogacion else None
                ),
                categoria_erogacion_nombre=(
                    movimiento.categoria_erogacion.nombre
                    if movimiento.categoria_erogacion else None
                ),
                grupo_utn_id=movimiento.grupo_utn_id,
                grupo_utn_nombre=(
                    movimiento.grupo_utn.nombre_sigla_grupo
                    if movimiento.grupo_utn else None
                ),
                created_by=user_id,
            )
            db.session.add(snapshot)
            snapshots.append(snapshot)
        return snapshots

    @staticmethod
    def obtener_snapshots_por_memoria_version(memoria_version_id: int):
        snapshots = MovimientoMemoriaVersion.query.filter(
            MovimientoMemoriaVersion.memoria_version_id == memoria_version_id,
            MovimientoMemoriaVersion.deleted_at.is_(None),
        ).order_by(
            MovimientoMemoriaVersion.fecha.desc(),
            MovimientoMemoriaVersion.numero_movimiento.desc(),
        ).all()
        return [snapshot.serialize() for snapshot in snapshots]
