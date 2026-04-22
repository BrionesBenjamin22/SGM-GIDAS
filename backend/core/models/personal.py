from extension import db
from core.models.trabajo_reunion import investigador_x_trabajo_reunion
from core.models.trabajo_revista import investigador_x_trabajo_revista
from core.models.audit_mixin import AuditMixin

# =====================================================
# PERSONAL
# =====================================================
class Personal(db.Model, AuditMixin):
    __tablename__ = 'personal'

    id = db.Column(db.Integer, primary_key=True)
    nombre_apellido = db.Column(db.String(120), nullable=False)
    horas_semanales = db.Column(db.Integer, nullable=False)
    activo = db.Column(db.Boolean, default=True, nullable=False)

    tipo_personal_id = db.Column(db.Integer, db.ForeignKey('tipo_personal.id'), nullable=False)
    grupo_utn_id = db.Column(db.Integer, db.ForeignKey('grupo_utn.id'), nullable=False)

    tipo_personal = db.relationship('TipoPersonal', back_populates='personal')
    grupo_utn = db.relationship('GrupoInvestigacionUtn', back_populates='personal')
    
    
    historial_horas = db.relationship(
        "PersonalHorasHistorial",
        back_populates="personal",
        cascade="all, delete-orphan"
    )


    def serialize(self):
        data = self.to_dict()
        horas_activas = next(
            (h.horas_semanales for h in self.historial_horas if h.fecha_fin is None),
            self.horas_semanales
        )
        data.update({
            "horas_semanales": horas_activas,
            "tipo_personal": self.tipo_personal.nombre if self.tipo_personal else None,
            "grupo": self.grupo_utn.nombre_sigla_grupo if self.grupo_utn else None,
            "historial_horas": [
                {
                    "id": h.id,
                    "horas_semanales": h.horas_semanales,
                    "fecha_inicio": str(h.fecha_inicio),
                    "fecha_fin": str(h.fecha_fin) if h.fecha_fin else None
                }
                for h in self.historial_horas
            ]
        })
        return data


# =====================================================
# BECARIO
# =====================================================
class Becario(db.Model, AuditMixin):
    __tablename__ = 'becario'

    id = db.Column(db.Integer, primary_key=True)
    nombre_apellido = db.Column(db.String(120), nullable=False)
    horas_semanales = db.Column(db.Integer, nullable=False)
    activo = db.Column(db.Boolean, default=True, nullable=False)

    tipo_formacion_id = db.Column(
        db.Integer,
        db.ForeignKey('tipo_formacion_becario.id'),
        nullable=False
    )

    grupo_utn_id = db.Column(db.Integer, db.ForeignKey('grupo_utn.id'))

    tipo_formacion = db.relationship(
        'TipoFormacion',
        back_populates='becarios'
    )

    grupo_utn = db.relationship(
        'GrupoInvestigacionUtn',
        back_populates='becarios'
    )

    participaciones_proyecto = db.relationship(
        "BecarioProyecto",
        back_populates="becario",
        cascade="all, delete-orphan"
    )

    becas = db.relationship(
        "Beca_Becario",
        back_populates="becario",
        cascade="all, delete-orphan"
    )

    historial_horas = db.relationship(
    "BecarioHorasHistorial",
    back_populates="becario",
    cascade="all, delete-orphan"
    )

    def serialize(self):
        data = self.to_dict()

        horas_activas = next(
            (h.horas_semanales for h in self.historial_horas if h.fecha_fin is None),
            self.horas_semanales
        )

        data.update({
            "horas_semanales": horas_activas,
            "tipo_formacion": self.tipo_formacion.nombre if self.tipo_formacion else None,
            "grupo": self.grupo_utn.nombre_sigla_grupo if self.grupo_utn else None,
            "historial_horas": [
                {
                    "id": h.id,
                    "horas_semanales": h.horas_semanales,
                    "fecha_inicio": str(h.fecha_inicio),
                    "fecha_fin": str(h.fecha_fin) if h.fecha_fin else None
                }
                for h in self.historial_horas
            ]
        })

        return data

class TipoFormacion(db.Model):
    __tablename__ = 'tipo_formacion_becario'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)

    becarios = db.relationship(
        'Becario',
        back_populates='tipo_formacion',
        lazy='select'
    )

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre
        }


# =====================================================
# TIPO DEDICACIÓN
# =====================================================
class TipoDedicacion(db.Model):
    __tablename__ = 'tipo_dedicacion'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)

    investigadores = db.relationship(
        'Investigador',
        back_populates='tipo_dedicacion',
        lazy='select'
    )

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre
        }


# =====================================================
# INVESTIGADOR
# =====================================================
class Investigador(db.Model, AuditMixin):
    __tablename__ = 'investigador'

    id = db.Column(db.Integer, primary_key=True)
    nombre_apellido = db.Column(db.String(120), nullable=False)
    horas_semanales = db.Column(db.Integer, nullable=False)
    activo = db.Column(db.Boolean, default=True, nullable=False)

    tipo_dedicacion_id = db.Column(db.Integer, db.ForeignKey('tipo_dedicacion.id'))
    categoria_utn_id = db.Column(db.Integer, db.ForeignKey('categoria_utn.id'), nullable=True)
    programa_incentivos_id = db.Column(db.Integer, db.ForeignKey('programa_incentivos_investigador.id'), nullable=True)
    grupo_utn_id = db.Column(db.Integer, db.ForeignKey('grupo_utn.id'), nullable=True)

    categoria_utn = db.relationship('CategoriaUtn', back_populates='investigadores')
    programa_incentivos = db.relationship('ProgramaIncentivos', back_populates='investigadores')
    grupo_utn = db.relationship('GrupoInvestigacionUtn', back_populates='investigadores')
    tipo_dedicacion = db.relationship('TipoDedicacion', back_populates='investigadores')

    trabajos_reunion_cientifica = db.relationship(
        'TrabajoReunionCientifica',
        secondary=investigador_x_trabajo_reunion,
        back_populates='investigadores'
    )

    grados_actividad = db.relationship(
        "InvestigadorActividadGrado",
        back_populates="investigador",
        cascade="all, delete-orphan"
    )

    participaciones_relevantes = db.relationship(
        'ParticipacionRelevante',
        back_populates='investigador',
        cascade='all, delete-orphan'
    )
    
    historial_horas = db.relationship(
        "InvestigadorHorasHistorial",
        back_populates="investigador",
        cascade="all, delete-orphan"
    )

    actividades_docencia = db.relationship('ActividadDocencia',
                                           back_populates="investigador")
    
    trabajos_revistas = db.relationship(
        'TrabajosRevistasReferato',
        secondary=investigador_x_trabajo_revista,
        back_populates='investigadores'
    )

    participaciones_proyecto = db.relationship(
        "InvestigadorProyecto",
        back_populates="investigador",
        cascade="all, delete-orphan"
    )

    def serialize(self):
        data = self.to_dict()

        historial_activo = next(
            (h for h in self.historial_horas if h.fecha_fin is None),
            None
        )

        horas_activas = (
            historial_activo.horas_semanales
            if historial_activo
            else self.horas_semanales
        )

        data.update({
            "horas_semanales": horas_activas,
            "categoria_utn": self.categoria_utn.nombre if self.categoria_utn else None,
            "programa_incentivos": self.programa_incentivos.nombre if self.programa_incentivos else None,
            "tipo_dedicacion": self.tipo_dedicacion.nombre if self.tipo_dedicacion else None,
            "grupo": self.grupo_utn.nombre_sigla_grupo if self.grupo_utn else None,
            "proyectos": [
                {
                    "id": p.proyecto.id,
                    "codigo": p.proyecto.codigo_proyecto,
                    "nombre": p.proyecto.nombre_proyecto,
                    "es_coordinador": p.es_coordinador,
                    "fecha_inicio": str(p.fecha_inicio),
                    "fecha_fin": str(p.fecha_fin) if p.fecha_fin else None
                }
                for p in self.participaciones_proyecto
            ],
            "participaciones_relevantes": [
                {"id": p.id, "evento": p.nombre_evento}
                for p in self.participaciones_relevantes
            ],
            "trabajos_reunion_cientifica": [
                {"id": t.id, "trabajo": t.titulo_trabajo}
                for t in self.trabajos_reunion_cientifica
            ],
            "historial_horas": [
                {
                    "id": h.id,
                    "horas_semanales": h.horas_semanales,
                    "fecha_inicio": str(h.fecha_inicio),
                    "fecha_fin": str(h.fecha_fin) if h.fecha_fin else None
                }
                for h in self.historial_horas
            ]
        })

        return data

    
    
class BecarioHorasHistorial(db.Model, AuditMixin):
    __tablename__ = "becario_historial_horas"

    id = db.Column(db.Integer, primary_key=True)

    becario_id = db.Column(
        db.Integer,
        db.ForeignKey("becario.id"),
        nullable=False
    )

    horas_semanales = db.Column(db.Integer, nullable=False)

    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=True)

    becario = db.relationship(
        "Becario",
        back_populates="historial_horas"
    )

    __table_args__ = ()
    
    
    
class InvestigadorHorasHistorial(db.Model, AuditMixin):
    __tablename__ = "investigador_historial_horas"
    id = db.Column(db.Integer, primary_key=True)

    investigador_id = db.Column(
        db.Integer,
        db.ForeignKey("investigador.id"),
        nullable=False
    )

    horas_semanales = db.Column(db.Integer, nullable=False)

    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=True)

    investigador = db.relationship(
        "Investigador",
        back_populates="historial_horas"
    )

    __table_args__ = ()
    
    
    
    
    
class PersonalHorasHistorial(db.Model, AuditMixin):
    __tablename__ = "personal_historial_horas"
    id = db.Column(db.Integer, primary_key=True)

    personal_id = db.Column(
        db.Integer,
        db.ForeignKey("personal.id"),
        nullable=False
    )

    horas_semanales = db.Column(db.Integer, nullable=False)

    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=True)

    personal = db.relationship(
        "Personal",
        back_populates="historial_horas"
    )

    __table_args__ = ()
    
