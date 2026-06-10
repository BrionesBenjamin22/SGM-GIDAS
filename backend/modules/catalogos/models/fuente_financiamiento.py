from extension import db

class FuenteFinanciamiento(db.Model):
    __tablename__ = 'fuente_financiamiento'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.Text) 

    # Relación uno-a-muchos con Beca (antes era con Becario)
    becas = db.relationship('Beca', back_populates='fuente_financiamiento', lazy="dynamic")
    proyectos_investigacion = db.relationship('ProyectoInvestigacion', back_populates='fuente_financiamiento', lazy="dynamic")
    erogaciones = db.relationship('Erogacion', back_populates='fuente_financiamiento', cascade="all, delete-orphan")
    
    def serialize(self):
        data = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        data["proyectos"] = [p.codigo_proyecto for p in self.proyectos_investigacion]
        data["becas"] = [b.nombre_beca for b in self.becas]
        return data
    
    def get_total_becas(self):
        return self.becas.count()

    def get_total_proyectos(self):
        return self.proyectos_investigacion.count()
