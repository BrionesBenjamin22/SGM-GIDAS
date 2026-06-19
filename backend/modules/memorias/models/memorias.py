import enum
from extension import db
from modules.shared.models.audit_mixin import AuditMixin


class EstadoMemoria(enum.Enum):
    ABIERTA = "abierta"
    EN_REVISION = "en revision"
    CERRADA = "cerrada"


class Memoria(db.Model, AuditMixin):
    __tablename__ = "memoria"

    id = db.Column(db.Integer, primary_key=True)
    periodo_inicio = db.Column(db.Date, nullable=False)
    periodo_fin = db.Column(db.Date, nullable=False)
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

    def serialize(self):
        data = self.to_dict()
        data["version_actual"] = (
            self.version_actual.serialize()
            if self.version_actual else None
        )
        data["cantidad_versiones"] = len(self.versiones)
        return data


class MemoriaVersion(db.Model, AuditMixin):
    __tablename__ = "memoria_version"

    id = db.Column(db.Integer, primary_key=True)
    numero_version = db.Column(db.Integer, nullable=False)
    # La apertura pertenece a la vida de esta version concreta. Puede ser
    # informada por el usuario al crearla o resolverse desde la capa de servicio.
    fecha_apertura = db.Column(db.DateTime, nullable=False)
    # La fecha de cierre se completa cuando la version deja de estar activa
    # por cambio a cerrada o por la logica de versionado definida en servicios.
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

    def serialize(self):
        data = self.to_dict()
        data["estado"] = self.estado.value if self.estado else None
        return data
