from extension import db


class TipoPersonal(db.Model):
    __tablename__ = 'tipo_personal'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    
    personal = db.relationship('Personal', back_populates='tipo_personal', lazy="dynamic")

    
    def serialize(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}  # type: ignore
    
   