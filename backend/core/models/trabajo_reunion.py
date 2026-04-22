from extension import db
from core.models.audit_mixin import AuditMixin

investigador_x_trabajo_reunion = db.Table(
    'investigador_x_trabajo_reunion',
    db.Column('investigador_id', db.Integer, db.ForeignKey('investigador.id'), primary_key=True),
    db.Column('trabajo_reunion_id', db.Integer, db.ForeignKey('trabajo_reunion_cientifica.id'), primary_key=True)
)



class TrabajoReunionCientifica(db.Model, AuditMixin):
    __tablename__ = 'trabajo_reunion_cientifica'

    id = db.Column(db.Integer, primary_key=True)

    titulo_trabajo = db.Column(db.Text, nullable=False)
    nombre_reunion = db.Column(db.Text, nullable=False)
    procedencia = db.Column(db.Text, nullable=False)

    fecha_inicio = db.Column(db.Date, nullable=False)

    tipo_reunion_id = db.Column(
        db.Integer,
        db.ForeignKey('tipo_reunion_cientifica.id'),
        nullable=False
    )

    tipo_reunion_cientifica = db.relationship(
        'TipoReunion',
        back_populates='trabajos_reunion_cientifica'
    )

    investigadores = db.relationship(
        'Investigador',
        secondary=investigador_x_trabajo_reunion,
        back_populates='trabajos_reunion_cientifica'
    )

    grupo_utn_id = db.Column(
        db.Integer,
        db.ForeignKey('grupo_utn.id')
    )

    grupo_utn = db.relationship(
        'GrupoInvestigacionUtn',
        back_populates='trabajos_reunion_cientifica'
    )

    __table_args__ = (
        db.UniqueConstraint(
            "titulo_trabajo",
            "deleted_at",
            name="uq_trabajo_reunion_activo"
        ),
    )

    def serialize(self):
        data = self.to_dict()

        data.update({
            "tipo_reunion": {
                "id": self.tipo_reunion_cientifica.id,
                "nombre": self.tipo_reunion_cientifica.nombre
            } if self.tipo_reunion_cientifica else None,

            "investigadores": [
                {
                    "id": inv.id,
                    "nombre_apellido": inv.nombre_apellido
                }
                for inv in self.investigadores
                if inv.deleted_at is None
            ],

            "grupo_utn": (
                self.grupo_utn.nombre_unidad_academica
                if self.grupo_utn else None
            )
        })

        return data
    
    
class TipoReunion(db.Model):
    __tablename__ = 'tipo_reunion_cientifica'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)

    trabajos_reunion_cientifica = db.relationship(
        'TrabajoReunionCientifica',
        back_populates='tipo_reunion_cientifica',
        lazy='select'
    )
    trabajos_revistas = db.relationship(
        'TrabajosRevistasReferato',
        back_populates='tipo_reunion',
        lazy='select'
    )
    
    visitas = db.relationship(
        'VisitaAcademica',
        back_populates='tipo_visita',
        lazy='select'
    )

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre
        }
        
