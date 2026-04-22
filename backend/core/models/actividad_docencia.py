from extension import db
from core.models.audit_mixin import AuditMixin

class ActividadDocencia(db.Model, AuditMixin):
    __tablename__ = 'actividad_y_catedra_posgrado'

    id = db.Column(db.Integer, primary_key=True)

    curso = db.Column(db.Text, nullable=False)
    institucion = db.Column(db.Text, nullable=False)

    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=False)

    investigador_id = db.Column(
        db.Integer,
        db.ForeignKey('investigador.id'),
        nullable=False
    )
    
    investigador = db.relationship(
    "Investigador",
    back_populates="actividades_docencia"
    )

    investigadores_grado = db.relationship(
        "InvestigadorActividadGrado",
        back_populates="actividad_docencia",
        cascade="all, delete-orphan"
    )
        
    rol_actividad_id = db.Column(
        db.Integer,
        db.ForeignKey('rol_actividad_docencia.id')
    )

    rol_actividad = db.relationship(
        'RolActividad',
        back_populates='actividades_docencia'
    )

    def serialize(self):
        data = self.to_dict()

        grado_activo = next(
            (
                h.grado_academico
                for h in self.investigadores_grado
                if h.fecha_fin is None
            ),
            None
        )

        data.update({
            "investigador": (
                self.investigador.nombre_apellido
                if self.investigador and self.investigador.deleted_at is None
                else None
            ),
            "grado_academico": (
                {
                    "id": grado_activo.id,
                    "nombre": grado_activo.nombre
                }
                if grado_activo else None
            ),
            "rol_actividad": (
                {
                    "id": self.rol_actividad.id,
                    "nombre": self.rol_actividad.nombre
                }
                if self.rol_actividad else None
            ),
            
            "historial_grados": [
                {
                    "id": h.id,
                    "grado": {
                        "id": h.grado_academico.id,
                        "nombre": h.grado_academico.nombre
                    },
                    "fecha_inicio": str(h.fecha_inicio),
                    "fecha_fin": str(h.fecha_fin) if h.fecha_fin else None
                }
                for h in self.investigadores_grado
            ]
        })

        return data



class RolActividad(db.Model):
    __tablename__ = 'rol_actividad_docencia'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)

    actividades_docencia = db.relationship(
        'ActividadDocencia',
        back_populates='rol_actividad',
        lazy='select'
    )

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre
        }
        
        
class GradoAcademico(db.Model):
    __tablename__ = 'grado_academico'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)

    participaciones = db.relationship(
        "InvestigadorActividadGrado",
        back_populates="grado_academico",
        cascade="all, delete-orphan"
    )

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre
        }
        
        
class InvestigadorActividadGrado(db.Model, AuditMixin):
    __tablename__ = "investigador_actividad_grado"

    id = db.Column(db.Integer, primary_key=True)

    investigador_id = db.Column(
        db.Integer,
        db.ForeignKey("investigador.id"),
        nullable=False
    )

    actividad_docencia_id = db.Column(
        db.Integer,
        db.ForeignKey("actividad_y_catedra_posgrado.id"),
        nullable=False
    )

    grado_academico_id = db.Column(
        db.Integer,
        db.ForeignKey("grado_academico.id"),
        nullable=False
    )

    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=True)

    investigador = db.relationship(
        "Investigador",
        back_populates="grados_actividad"
    )

    actividad_docencia = db.relationship(
        "ActividadDocencia",
        back_populates="investigadores_grado"
    )

    grado_academico = db.relationship(
        "GradoAcademico",
        back_populates="participaciones"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "investigador_id",
            "actividad_docencia_id",
            "grado_academico_id",
            "fecha_inicio",
            name="uq_hist_grado_actividad"
        ),
    )