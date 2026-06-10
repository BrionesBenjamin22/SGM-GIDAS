from extension import db
from core.models.audit_mixin import AuditMixin


class CategoriaUtn(db.Model, AuditMixin):
    __tablename__ = 'categoria_utn'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.Text, nullable=False)
    
    investigadores = db.relationship('Investigador', back_populates='categoria_utn', lazy='dynamic')
    
    def serialize(self):
        return self.to_dict()
