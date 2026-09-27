"""Saldo derivado de movimientos activos de una UCT."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from sqlalchemy import case, func, select

from extension import db
from modules.grupo.models.grupo import GrupoInvestigacionUtn
from modules.recursos.models.movimiento_financiero import MovimientoFinanciero
from modules.shared.exceptions import ConflictError, NotFoundError


@dataclass(frozen=True)
class ResumenFinanciero:
    total_ingresos: Decimal
    total_egresos: Decimal
    cantidad_movimientos: int

    @property
    def saldo_disponible(self) -> Decimal:
        return self.total_ingresos - self.total_egresos

    def serialize(self) -> dict:
        return {
            "moneda": "ARS",
            "total_ingresos": str(self.total_ingresos),
            "total_egresos": str(self.total_egresos),
            "saldo_disponible": str(self.saldo_disponible),
            "cantidad_movimientos": self.cantidad_movimientos,
        }


class SaldoFinancieroService:
    @staticmethod
    def calcular(
        grupo_utn_id: int | None,
        fecha_desde: date | None = None,
        fecha_hasta: date | None = None,
    ) -> ResumenFinanciero:
        activos = [MovimientoFinanciero.deleted_at.is_(None)]
        if grupo_utn_id is not None:
            grupo = db.session.get(GrupoInvestigacionUtn, grupo_utn_id)
            if grupo is None or grupo.deleted_at is not None:
                raise NotFoundError("El grupo no está disponible. Recargue la página e intente nuevamente.")
            activos.append(MovimientoFinanciero.grupo_utn_id == grupo_utn_id)
        if fecha_desde is not None:
            activos.append(MovimientoFinanciero.fecha >= fecha_desde)
        if fecha_hasta is not None:
            activos.append(MovimientoFinanciero.fecha <= fecha_hasta)
        monedas_no_convertidas = db.session.scalar(
            select(func.count(MovimientoFinanciero.id)).where(
                *activos, MovimientoFinanciero.moneda != "ARS"
            )
        ) or 0
        if monedas_no_convertidas:
            raise ConflictError(
                "No se puede calcular un saldo consolidado sin convertir los movimientos en otras monedas."
            )

        ingresos, egresos, cantidad = db.session.execute(
            select(
                func.coalesce(func.sum(case(
                    (MovimientoFinanciero.tipo_movimiento == "INGRESO", MovimientoFinanciero.monto),
                    else_=0,
                )), 0),
                func.coalesce(func.sum(case(
                    (MovimientoFinanciero.tipo_movimiento == "EGRESO", MovimientoFinanciero.monto),
                    else_=0,
                )), 0),
                func.count(MovimientoFinanciero.id),
            ).where(*activos)
        ).one()
        return ResumenFinanciero(
            total_ingresos=Decimal(str(ingresos)),
            total_egresos=Decimal(str(egresos)),
            cantidad_movimientos=int(cantidad),
        )
