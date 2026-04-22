from extension import db
from core.models.audit_mixin import AuditMixin

class Persona(db.Model, AuditMixin):
    __tablename__ = "persona"
    
    id = db.Column(db.Integer, primary_key=True)
    nombre_apellido = db.Column(db.String(100), nullable=False)
    dni = db.Column(db.Integer, unique=True, nullable=False)
    
    usuario = db.relationship(
        "Usuario",
        back_populates="persona",
        foreign_keys="Usuario.id_persona"
    )
    
    
    def serialize(self):
        data = self.to_dict()
        data["usuario"] = self.usuario.serialize() if self.usuario else None
        return data
    
    