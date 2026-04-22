from extension import db
from core.models.audit_mixin import AuditMixin

class ArticuloDivulgacion(db.Model, AuditMixin):
    __tablename__ = 'articulo_divulgacion'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    titulo = db.Column(db.Text, nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    fecha_publicacion = db.Column(db.Date, nullable=False)
    grupo_utn_id = db.Column(db.Integer, db.ForeignKey('grupo_utn.id'), nullable=False)
    grupo_utn = db.relationship('GrupoInvestigacionUtn', back_populates='articulos_divulgacion')
    
    def serialize(self):
        data = self.to_dict()
        data["grupo_utn"] = {
            "id": self.grupo_utn.id,
            "nombre": self.grupo_utn.nombre_sigla_grupo
        } if self.grupo_utn else None
        return data

    
    
