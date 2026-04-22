from extension import db
from core.models.audit_mixin import AuditMixin
from core.models.trabajo_reunion import TipoReunion


class VisitaAcademica(db.Model, AuditMixin):
    __tablename__ = 'visita_grupo'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    razon = db.Column(db.Text, nullable=False)
    fecha = db.Column(db.Date, nullable=False)
    
    # Procedencia ahora es un string en lugar de ForeignKey
    procedencia = db.Column(db.Text, nullable=False)
    
    # Tipo de visita ahora apunta a TipoReunion
    tipo_visita_id = db.Column(db.Integer, db.ForeignKey('tipo_reunion_cientifica.id'), nullable=False)
    tipo_visita = db.relationship('TipoReunion', back_populates='visitas')
    
    # --- Clave Foránea y Relación ---
    grupo_utn_id = db.Column(db.Integer, db.ForeignKey('grupo_utn.id'))
    grupo_utn = db.relationship('GrupoInvestigacionUtn', back_populates='visitas')

    def serialize(self):
        data = self.to_dict()
        data["grupo"] = self.grupo_utn.nombre_sigla_grupo if self.grupo_utn else None
        # Procedencia ahora es un string simple
        data["procedencia"] = self.procedencia
        data["tipo_visita"] = {
            "id": self.tipo_visita.id,
            "nombre": self.tipo_visita.nombre
        }
        return data
