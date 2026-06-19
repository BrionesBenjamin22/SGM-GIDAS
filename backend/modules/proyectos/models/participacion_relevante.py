from extension import db
from modules.shared.models.audit_mixin import AuditMixin

class ParticipacionRelevante(db.Model, AuditMixin):
    __tablename__ = 'participacion_relevante'
    id = db.Column(db.Integer, primary_key=True)
    nombre_evento = db.Column(db.Text, nullable=False) 
    forma_participacion = db.Column(db.Text, nullable=False) 
    fecha = db.Column(db.Date, nullable=False) 

    # --- Clave Foránea y Relación ---
    investigador_id = db.Column(db.Integer, db.ForeignKey('investigador.id')) 
    investigador = db.relationship('Investigador', back_populates='participaciones_relevantes')

    def serialize(self):
        data = self.to_dict()
        data["investigador"] = self.investigador.nombre_apellido if self.investigador else None
        return data


class ParticipacionRelevanteMemoriaVersion(db.Model, AuditMixin):
    __tablename__ = "participacion_relevante_memoria_version"

    id = db.Column(db.Integer, primary_key=True)

    memoria_version_id = db.Column(
        db.Integer,
        db.ForeignKey("memoria_version.id"),
        nullable=False
    )
    participacion_relevante_id = db.Column(
        db.Integer,
        db.ForeignKey("participacion_relevante.id"),
        nullable=False
    )

    nombre_evento = db.Column(db.Text, nullable=False)
    forma_participacion = db.Column(db.Text, nullable=False)
    fecha = db.Column(db.Date, nullable=False)

    investigador_id = db.Column(
        db.Integer,
        db.ForeignKey("investigador.id"),
        nullable=False
    )
    investigador_nombre = db.Column(db.String(255), nullable=True)

    memoria_version = db.relationship("MemoriaVersion", lazy="joined")
    participacion_relevante = db.relationship("ParticipacionRelevante", lazy="joined")
    investigador = db.relationship("Investigador", lazy="joined")

    __table_args__ = (
        db.UniqueConstraint(
            "memoria_version_id",
            "participacion_relevante_id",
            name="uq_participacion_relevante_memoria_version"
        ),
    )

    def serialize(self):
        return self.to_dict()
