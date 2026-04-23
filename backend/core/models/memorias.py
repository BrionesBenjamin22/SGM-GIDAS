import enum

from extension import db
from core.models.audit_mixin import AuditMixin


class EstadoMemoria(enum.Enum):
    ABIERTA = "abierta"
    EN_REVISION = "en revision"
    CERRADA = "cerrada"


class Memoria(db.Model, AuditMixin):
    __tablename__ = "memoria"

    id = db.Column(db.Integer, primary_key=True)
    periodo_inicio = db.Column(db.String(50), nullable=False)
    periodo_fin = db.Column(db.String(50), nullable=False)
    version_actual_id = db.Column(
        db.Integer,
        db.ForeignKey("memoria_version.id"),
        nullable=True
    )

    versiones = db.relationship(
        "MemoriaVersion",
        back_populates="memoria",
        foreign_keys="MemoriaVersion.memoria_id",
        cascade="all, delete-orphan",
        order_by="MemoriaVersion.numero_version"
    )

    version_actual = db.relationship(
        "MemoriaVersion",
        foreign_keys=[version_actual_id],
        post_update=True
    )


class MemoriaVersion(db.Model, AuditMixin):
    __tablename__ = "memoria_version"

    id = db.Column(db.Integer, primary_key=True)
    numero_version = db.Column(db.Integer, nullable=False)
    fecha_apertura = db.Column(db.DateTime, nullable=False)
    fecha_cierre = db.Column(db.DateTime, nullable=True)
    estado = db.Column(
        db.Enum(
            EstadoMemoria,
            values_callable=lambda estados: [estado.value for estado in estados],
            native_enum=False,
            name="estado_memoria_enum"
        ),
        nullable=False,
        default=EstadoMemoria.ABIERTA
    )
    memoria_id = db.Column(
        db.Integer,
        db.ForeignKey("memoria.id"),
        nullable=False
    )

    memoria = db.relationship(
        "Memoria",
        back_populates="versiones",
        foreign_keys=[memoria_id]
    )

    __table_args__ = (
        db.UniqueConstraint(
            "memoria_id",
            "numero_version",
            name="uq_memoria_version_numero"
        ),
    )
