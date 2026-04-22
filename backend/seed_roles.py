from app import app
from extension import db
from core.models.usuario import RolUsuario


def seed_roles():
    roles = ["ADMIN", "GESTOR", "LECTOR"]

    for nombre in roles:
        existe = RolUsuario.query.filter_by(nombre=nombre).first()
        if not existe:
            db.session.add(RolUsuario(nombre=nombre))

    db.session.commit()
    print("Roles iniciales verificados/cargados correctamente")


if __name__ == "__main__":
    with app.app_context():
        seed_roles()