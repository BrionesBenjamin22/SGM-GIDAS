from extension import db
from core.models.audit_mixin import AuditMixin

class Equipamiento(db.Model, AuditMixin):
    __tablename__ = 'equipamiento_grupo'

    id = db.Column(db.Integer, primary_key=True)
    denominacion = db.Column(db.Text, nullable=False)
    descripcion_breve = db.Column(db.Text, nullable=False)
    fecha_incorporacion = db.Column(db.Date, nullable=False)  # mejor como Date
    monto_invertido = db.Column(db.Float, nullable=False)

    # --- Claves Foráneas y Relaciones ---
    grupo_utn_id = db.Column(db.Integer, db.ForeignKey('grupo_utn.id'), nullable=False)
    grupo_utn = db.relationship('GrupoInvestigacionUtn', back_populates='equipamiento')


    def serialize(self):
        
        data = self.to_dict()
        data["grupo"] = self.grupo_utn.nombre_sigla_grupo if self.grupo_utn else None
        return data
    
    