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


class TrabajoReunionCientificaMemoriaVersion(db.Model, AuditMixin):
    __tablename__ = "trabajo_reunion_cientifica_memoria_version"

    id = db.Column(db.Integer, primary_key=True)

    memoria_version_id = db.Column(
        db.Integer,
        db.ForeignKey("memoria_version.id"),
        nullable=False
    )
    trabajo_reunion_id = db.Column(
        db.Integer,
        db.ForeignKey("trabajo_reunion_cientifica.id"),
        nullable=False
    )

    titulo_trabajo = db.Column(db.Text, nullable=False)
    nombre_reunion = db.Column(db.Text, nullable=False)
    procedencia = db.Column(db.Text, nullable=False)
    fecha_inicio = db.Column(db.Date, nullable=False)

    tipo_reunion_id = db.Column(
        db.Integer,
        db.ForeignKey("tipo_reunion_cientifica.id"),
        nullable=False
    )
    tipo_reunion_nombre = db.Column(db.String(100), nullable=True)

    grupo_utn_id = db.Column(
        db.Integer,
        db.ForeignKey("grupo_utn.id"),
        nullable=True
    )
    grupo_utn_nombre = db.Column(db.String(255), nullable=True)
    investigadores_participantes = db.Column(db.Text, nullable=True)

    memoria_version = db.relationship("MemoriaVersion", lazy="joined")
    trabajo_reunion = db.relationship("TrabajoReunionCientifica", lazy="joined")
    tipo_reunion = db.relationship("TipoReunion", lazy="joined")
    grupo_utn = db.relationship("GrupoInvestigacionUtn", lazy="joined")

    __table_args__ = (
        db.UniqueConstraint(
            "memoria_version_id",
            "trabajo_reunion_id",
            name="uq_trabajo_reunion_memoria_version"
        ),
    )

    def serialize(self):
        data = self.to_dict()
        data["investigadores_participantes"] = (
            self.investigadores_participantes or ""
        )
        return data
    
    
class TipoReunion(db.Model, AuditMixin):
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
        return self.to_dict()
        
