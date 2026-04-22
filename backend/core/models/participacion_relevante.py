from extension import db
from core.models.audit_mixin import AuditMixin

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
    
