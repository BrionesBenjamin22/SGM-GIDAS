import datetime
import re
from sqlalchemy.orm import validates
from extension import db
from core.models.trabajo_reunion import TipoReunion
from core.models.audit_mixin import AuditMixin


investigador_x_trabajo_revista = db.Table(
    'investigador_x_trabajo_revista',
    db.Column('investigador_id', db.Integer, db.ForeignKey('investigador.id'), primary_key=True),
    db.Column('trabajos_revista_id', db.Integer, db.ForeignKey('trabajos_revista.id'), primary_key=True)
)

class TrabajosRevistasReferato(db.Model, AuditMixin):
    __tablename__ = 'trabajos_revista'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)

    titulo_trabajo = db.Column(db.Text, nullable=False)
    nombre_revista = db.Column(db.Text, nullable=False)
    editorial = db.Column(db.Text, nullable=False)
    issn = db.Column(db.Text, nullable=False)
    pais = db.Column(db.Text, nullable=False)
    fecha = db.Column(db.Date, nullable=False)

    grupo_utn_id = db.Column(
        db.Integer,
        db.ForeignKey('grupo_utn.id')
    )

    grupo_utn = db.relationship(
        'GrupoInvestigacionUtn',
        back_populates='trabajos_revistas'
    )

    tipo_reunion_id = db.Column(
        db.Integer,
        db.ForeignKey('tipo_reunion_cientifica.id'),
        nullable=False
    )

    tipo_reunion = db.relationship(
        'TipoReunion',
        back_populates='trabajos_revistas'
    )

    investigadores = db.relationship(
        'Investigador',
        secondary=investigador_x_trabajo_revista,
        back_populates='trabajos_revistas'
    )

    def serialize(self):
        data = self.to_dict()

        data.update({
            "grupo": (
                self.grupo_utn.nombre_sigla_grupo
                if self.grupo_utn else None
            ),
            "investigadores": [
                {
                    "id": inv.id,
                    "nombre_apellido": inv.nombre_apellido
                }
                for inv in self.investigadores
                if inv.deleted_at is None
            ],
            "tipo_reunion": (
                {
                    "id": self.tipo_reunion.id,
                    "nombre": self.tipo_reunion.nombre
                }
                if self.tipo_reunion else None
            )
        })

        return data
    

