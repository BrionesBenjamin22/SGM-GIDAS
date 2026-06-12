from extension import db
from modules.shared.models.audit_mixin import AuditMixin

class RegistrosPropiedad(db.Model, AuditMixin):
    __tablename__ = 'registros_patente_grupo'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)

    nombre_articulo = db.Column(db.Text, nullable=False)
    organismo_registrante = db.Column(db.Text, nullable=False)
    fecha_registro = db.Column(db.Date, nullable=False)

    tipo_registro_id = db.Column(
        db.Integer,
        db.ForeignKey('tipo_registro_propiedad.id'),
        nullable=False
    )

    tipo_registro = db.relationship(
        'TipoRegistroPropiedad',
        back_populates='registros_propiedad'
    )

    grupo_utn_id = db.Column(
        db.Integer,
        db.ForeignKey('grupo_utn.id'),
        nullable=False
    )

    grupo_utn = db.relationship(
        'GrupoInvestigacionUtn',
        back_populates='registros_propiedad'
    )

    def serialize(self):
        data = self.to_dict()

        data.update({
            "tipo_registro": (
                self.tipo_registro.nombre
                if self.tipo_registro else None
            ),
            "grupo": (
                self.grupo_utn.nombre_sigla_grupo
                if self.grupo_utn else None
            )
        })

        return data


class RegistrosPropiedadMemoriaVersion(db.Model, AuditMixin):
    __tablename__ = "registros_propiedad_memoria_version"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)

    memoria_version_id = db.Column(
        db.Integer,
        db.ForeignKey("memoria_version.id"),
        nullable=False
    )
    registro_propiedad_id = db.Column(
        db.Integer,
        db.ForeignKey("registros_patente_grupo.id"),
        nullable=False
    )

    nombre_articulo = db.Column(db.Text, nullable=False)
    organismo_registrante = db.Column(db.Text, nullable=False)
    fecha_registro = db.Column(db.Date, nullable=False)

    tipo_registro_id = db.Column(
        db.Integer,
        db.ForeignKey("tipo_registro_propiedad.id"),
        nullable=False
    )
    tipo_registro_nombre = db.Column(db.Text, nullable=True)

    grupo_utn_id = db.Column(
        db.Integer,
        db.ForeignKey("grupo_utn.id"),
        nullable=False
    )
    grupo_utn_nombre = db.Column(db.String(255), nullable=True)

    memoria_version = db.relationship("MemoriaVersion", lazy="joined")
    registro_propiedad = db.relationship("RegistrosPropiedad", lazy="joined")
    tipo_registro_rel = db.relationship("TipoRegistroPropiedad", lazy="joined")
    grupo_utn = db.relationship("GrupoInvestigacionUtn", lazy="joined")

    __table_args__ = (
        db.UniqueConstraint(
            "memoria_version_id",
            "registro_propiedad_id",
            name="uq_registro_propiedad_memoria_version"
        ),
    )

    def serialize(self):
        return self.to_dict()


class TipoRegistroPropiedad(db.Model, AuditMixin):
    __tablename__ = 'tipo_registro_propiedad'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    nombre = db.Column(db.Text, nullable=False)

    registros_propiedad = db.relationship(
        'RegistrosPropiedad',
        back_populates='tipo_registro'
    )

    def serialize(self):
        return self.to_dict()
