from datetime import date
from extension import db
from core.models.audit_mixin import AuditMixin

class TipoErogacion(db.Model):
    __tablename__ = 'tipo_erogacion'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    nombre = db.Column(db.Text, nullable=False)

    erogaciones = db.relationship('Erogacion', back_populates='tipo_erogacion', cascade="all, delete-orphan")

    def serialize(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class Erogacion(db.Model, AuditMixin):
    __tablename__ = 'erogacion'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)

    numero_erogacion = db.Column(db.Integer, nullable=True)

    egresos = db.Column(db.Float, nullable=False)
    ingresos = db.Column(db.Float, nullable=False)

    fecha = db.Column(
        db.Date,
        default=date.today,
        nullable=False
    )

    tipo_erogacion_id = db.Column(
        db.Integer,
        db.ForeignKey('tipo_erogacion.id'),
        nullable=False
    )

    tipo_erogacion = db.relationship(
        'TipoErogacion',
        back_populates='erogaciones'
    )

    fuente_financiamiento_id = db.Column(
        db.Integer,
        db.ForeignKey('fuente_financiamiento.id'),
        nullable=False
    )

    fuente_financiamiento = db.relationship(
        'FuenteFinanciamiento',
        back_populates='erogaciones'
    )

    grupo_utn_id = db.Column(
        db.Integer,
        db.ForeignKey('grupo_utn.id'),
        nullable=False
    )

    grupo_utn = db.relationship(
        'GrupoInvestigacionUtn',
        back_populates='erogaciones'
    )

    __table_args__ = (
        db.UniqueConstraint(
            "numero_erogacion",
            "grupo_utn_id",
            "deleted_at",
            name="uq_erogacion_numero_activo"
        ),
    )

    def serialize(self):
        data = self.to_dict()

        data.update({
            "grupo": {
                "id": self.grupo_utn.id,
                "nombre": self.grupo_utn.nombre_sigla_grupo
            } if self.grupo_utn else None,

            "fuente": {
                "id": self.fuente_financiamiento.id,
                "nombre": self.fuente_financiamiento.nombre
            } if self.fuente_financiamiento else None,

            "tipo_erogacion": {
                "id": self.tipo_erogacion.id,
                "nombre": self.tipo_erogacion.nombre
            } if self.tipo_erogacion else None
        })

        return data