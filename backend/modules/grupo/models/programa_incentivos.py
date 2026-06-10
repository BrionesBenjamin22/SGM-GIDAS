from extension import db


class ProgramaIncentivos(db.Model):
    __tablename__ = 'programa_incentivos_investigador'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.Text, nullable=False)
    
    investigadores = db.relationship('Investigador', back_populates='programa_incentivos', lazy="dynamic")
    
    def serialize(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


