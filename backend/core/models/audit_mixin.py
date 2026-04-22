from datetime import date, datetime
from sqlalchemy.ext.declarative import declared_attr
from extension import db


class AuditMixin:

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    deleted_at = db.Column(db.DateTime, nullable=True)
    
    activo = db.Column(db.Boolean, default=True, nullable=False)


    @declared_attr
    def created_by(cls):
        return db.Column(db.Integer, db.ForeignKey("usuario.id"), nullable=True)

    @declared_attr
    def created_by_user(cls):
        return db.relationship(
            "Usuario",
            foreign_keys=[cls.created_by],
            lazy="joined"
        )

    @declared_attr
    def deleted_by(cls):
        return db.Column(db.Integer, db.ForeignKey("usuario.id"), nullable=True)

    @declared_attr
    def deleted_by_user(cls):
        return db.relationship(
            "Usuario",
            foreign_keys=[cls.deleted_by],
            lazy="joined"
        )

    def soft_delete(self, user_id: int):
        self.deleted_at = datetime.utcnow()
        self.deleted_by = user_id
        self.activo = False

    def restore(self):
        self.deleted_at = None
        self.deleted_by = None
        self.activo = True

    @staticmethod
    def _get_audit_user_name(user):
        if not user:
            return None

        if getattr(user, "persona", None) and user.persona.nombre_apellido:
            return user.persona.nombre_apellido

        return user.nombre_usuario

    def to_dict(self):
        data = {}

        for column in self.__table__.columns:
            value = getattr(self, column.name)

            if isinstance(value, (datetime, date)):
                value = value.isoformat()

            data[column.name] = value

        data["created_by_nombre"] = self._get_audit_user_name(
            getattr(self, "created_by_user", None)
        )
        data["deleted_by_nombre"] = self._get_audit_user_name(
            getattr(self, "deleted_by_user", None)
        )

        return data
