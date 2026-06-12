from extension import db
from modules.shared.models.audit_mixin import AuditMixin

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


class ArticuloDivulgacionMemoriaVersion(db.Model, AuditMixin):
    __tablename__ = "articulo_divulgacion_memoria_version"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)

    memoria_version_id = db.Column(
        db.Integer,
        db.ForeignKey("memoria_version.id"),
        nullable=False
    )
    articulo_divulgacion_id = db.Column(
        db.Integer,
        db.ForeignKey("articulo_divulgacion.id"),
        nullable=False
    )

    titulo = db.Column(db.Text, nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    fecha_publicacion = db.Column(db.Date, nullable=False)

    grupo_utn_id = db.Column(
        db.Integer,
        db.ForeignKey("grupo_utn.id"),
        nullable=False
    )
    grupo_utn_nombre = db.Column(db.String(255), nullable=True)

    memoria_version = db.relationship("MemoriaVersion", lazy="joined")
    articulo_divulgacion = db.relationship("ArticuloDivulgacion", lazy="joined")
    grupo_utn = db.relationship("GrupoInvestigacionUtn", lazy="joined")

    __table_args__ = (
        db.UniqueConstraint(
            "memoria_version_id",
            "articulo_divulgacion_id",
            name="uq_articulo_divulgacion_memoria_version"
        ),
    )

    def serialize(self):
        return self.to_dict()

    
    
