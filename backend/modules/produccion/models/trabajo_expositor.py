"""Expositores de reuniones; las autorías bibliográficas conservan su relación."""
from extension import db


class TrabajoReunionExpositor(db.Model):
    __tablename__ = "trabajo_reunion_expositor"

    id = db.Column(db.Integer, primary_key=True)
    trabajo_id = db.Column(db.Integer, db.ForeignKey("trabajo_reunion_cientifica.id", ondelete="CASCADE"), nullable=False, index=True)
    investigador_id = db.Column(db.Integer, db.ForeignKey("investigador.id", ondelete="RESTRICT"), index=True)
    becario_id = db.Column(db.Integer, db.ForeignKey("becario.id", ondelete="RESTRICT"), index=True)
    personal_id = db.Column(db.Integer, db.ForeignKey("personal.id", ondelete="RESTRICT"), index=True)
    nombre_externo = db.Column(db.String(120))
    nombre_clave = db.Column(db.String(120))
    trabajo = db.relationship("TrabajoReunionCientifica", back_populates="expositores")
    investigador = db.relationship("Investigador", lazy="joined")
    becario = db.relationship("Becario", lazy="joined")
    personal = db.relationship("Personal", lazy="joined")

    __table_args__ = (
        db.CheckConstraint("(CASE WHEN investigador_id IS NULL THEN 0 ELSE 1 END + CASE WHEN becario_id IS NULL THEN 0 ELSE 1 END + CASE WHEN personal_id IS NULL THEN 0 ELSE 1 END + CASE WHEN nombre_externo IS NULL THEN 0 ELSE 1 END) = 1", name="ck_expositor_una_identidad"),
        db.CheckConstraint("(nombre_externo IS NULL AND nombre_clave IS NULL) OR (nombre_externo IS NOT NULL AND nombre_clave IS NOT NULL AND length(trim(nombre_externo)) > 0 AND length(trim(nombre_clave)) > 0)", name="ck_expositor_nombre_externo"),
        *(db.UniqueConstraint("trabajo_id", campo, name=f"uq_expositor_{campo}") for campo in ("investigador_id", "becario_id", "personal_id", "nombre_clave")),
    )

    @property
    def rol(self):
        return next((rol for rol in ("investigador", "becario", "personal") if getattr(self, f"{rol}_id") is not None), "externo")

    @property
    def integrante(self):
        return None if self.rol == "externo" else getattr(self, self.rol)

    def serialize(self):
        persona = self.integrante
        return {"rol": self.rol, "id": persona.id if persona else None,
                "identidad_id": persona.identidad_id if persona else None,
                "nombre_apellido": persona.nombre_apellido if persona else self.nombre_externo,
                "tipo": {"investigador": "Investigador", "becario": "Becario", "personal": "Personal", "externo": "Externo"}[self.rol],
                "activo": bool(persona.activo and persona.deleted_at is None) if persona else True}
