from extension import db
from modules.shared.models.audit_mixin import AuditMixin


class ProgramaIncentivos(db.Model, AuditMixin):
    __tablename__ = 'programa_incentivos_investigador'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.Text, nullable=False)
    
    investigadores = db.relationship('Investigador', back_populates='programa_incentivos', lazy="dynamic")
    
    def serialize(self):
        return self.to_dict()


