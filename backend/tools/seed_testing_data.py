import os
import sys
from datetime import date, datetime
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app import app
from extension import db
from modules.catalogos.models.categoria_utn import CategoriaUtn
from modules.catalogos.models.fuente_financiamiento import FuenteFinanciamiento
from modules.grupo.models.grupo import GrupoInvestigacionUtn
from modules.memorias.models.memorias import EstadoMemoria, Memoria, MemoriaVersion
from modules.auth.models.persona import Persona
from modules.personal.models.personal import (
    Becario,
    BecarioHorasHistorial,
    Investigador,
    InvestigadorHorasHistorial,
    Personal,
    PersonalHorasHistorial,
    TipoDedicacion,
    TipoFormacion,
)
from modules.grupo.models.programa_incentivos import ProgramaIncentivos
from modules.proyectos.models.proyecto_investigacion import (
    BecarioProyecto,
    InvestigadorProyecto,
    ProyectoInvestigacion,
    TipoProyecto,
)
from modules.personal.models.tipo_personal import TipoPersonal
from modules.auth.models.usuario import RolUsuario, Usuario


TEST_PASSWORD = "Testing123!"


def _assert_testing_environment():
    app_env = os.getenv("APP_ENV", "").strip().lower()
    allow_seed = os.getenv("ALLOW_TEST_SEED", "").strip().lower() == "true"
    if app_env != "testing" and not allow_seed:
        raise RuntimeError(
            "Seed cancelado: requiere APP_ENV=testing o ALLOW_TEST_SEED=true"
        )


def _get_or_create(model, defaults=None, **filters):
    instance = model.query.filter_by(**filters).first()
    if instance:
        return instance, False

    values = {**filters, **(defaults or {})}
    instance = model(**values)
    db.session.add(instance)
    db.session.flush()
    return instance, True


def _seed_roles():
    roles = {}
    for nombre in ["ADMIN", "GESTOR", "LECTOR"]:
        rol, _ = _get_or_create(RolUsuario, nombre=nombre)
        roles[nombre] = rol
    return roles


def _seed_user(nombre_usuario, mail, nombre_apellido, dni, rol):
    user = Usuario.query.filter_by(nombre_usuario=nombre_usuario).first()
    if user:
        return user

    persona, _ = _get_or_create(
        Persona,
        dni=dni,
        defaults={"nombre_apellido": nombre_apellido},
    )
    user = Usuario(
        nombre_usuario=nombre_usuario,
        mail=mail,
        id_rol=rol.id,
        id_persona=persona.id,
        primer_login=False,
    )
    user.set_password(TEST_PASSWORD)
    db.session.add(user)
    db.session.flush()
    return user


def _seed_catalogs():
    categoria, _ = _get_or_create(CategoriaUtn, nombre="Investigador formado")
    dedicacion, _ = _get_or_create(TipoDedicacion, nombre="Exclusiva")
    programa, _ = _get_or_create(ProgramaIncentivos, nombre="Categoria III")
    tipo_formacion, _ = _get_or_create(TipoFormacion, nombre="Beca doctoral")
    tipo_personal, _ = _get_or_create(TipoPersonal, nombre="Administrativo")
    tipo_proyecto, _ = _get_or_create(TipoProyecto, nombre="I+D")
    fuente, _ = _get_or_create(FuenteFinanciamiento, nombre="UTN")
    return {
        "categoria": categoria,
        "dedicacion": dedicacion,
        "programa": programa,
        "tipo_formacion": tipo_formacion,
        "tipo_personal": tipo_personal,
        "tipo_proyecto": tipo_proyecto,
        "fuente": fuente,
    }


def _seed_group():
    grupo = GrupoInvestigacionUtn.query.filter_by(
        nombre_sigla_grupo="GIDAS TEST"
    ).first()
    if grupo:
        return grupo

    grupo = GrupoInvestigacionUtn(
        mail="gidas.testing@example.com",
        nombre_unidad_academica="Facultad Regional de Prueba",
        objetivo_desarrollo="Datos ficticios para validar flujos del sistema.",
        nombre_sigla_grupo="GIDAS TEST",
    )
    db.session.add(grupo)
    db.session.flush()
    return grupo


def _seed_people(grupo, catalogs, admin_user_id):
    investigador, _ = _get_or_create(
        Investigador,
        nombre_apellido="Dra. Ana Perez",
        defaults={
            "horas_semanales": 40,
            "fecha_alta_grupo": date(2024, 1, 1),
            "tipo_dedicacion_id": catalogs["dedicacion"].id,
            "categoria_utn_id": catalogs["categoria"].id,
            "programa_incentivos_id": catalogs["programa"].id,
            "grupo_utn_id": grupo.id,
            "created_by": admin_user_id,
        },
    )
    if not investigador.historial_horas:
        db.session.add(
            InvestigadorHorasHistorial(
                investigador=investigador,
                horas_semanales=40,
                fecha_inicio=date(2024, 1, 1),
                created_by=admin_user_id,
            )
        )

    becario, _ = _get_or_create(
        Becario,
        nombre_apellido="Lic. Bruno Gomez",
        defaults={
            "horas_semanales": 20,
            "fecha_alta_grupo": date(2024, 3, 1),
            "tipo_formacion_id": catalogs["tipo_formacion"].id,
            "grupo_utn_id": grupo.id,
            "created_by": admin_user_id,
        },
    )
    if not becario.historial_horas:
        db.session.add(
            BecarioHorasHistorial(
                becario=becario,
                horas_semanales=20,
                fecha_inicio=date(2024, 3, 1),
                created_by=admin_user_id,
            )
        )

    personal, _ = _get_or_create(
        Personal,
        nombre_apellido="Carla Ruiz",
        defaults={
            "horas_semanales": 30,
            "fecha_alta_grupo": date(2024, 2, 1),
            "tipo_personal_id": catalogs["tipo_personal"].id,
            "grupo_utn_id": grupo.id,
            "created_by": admin_user_id,
        },
    )
    if not personal.historial_horas:
        db.session.add(
            PersonalHorasHistorial(
                personal=personal,
                horas_semanales=30,
                fecha_inicio=date(2024, 2, 1),
                created_by=admin_user_id,
            )
        )

    return investigador, becario, personal


def _seed_project(grupo, catalogs, investigador, becario, admin_user_id):
    proyecto = ProyectoInvestigacion.query.filter_by(
        codigo_proyecto=2026001
    ).first()
    if not proyecto:
        proyecto = ProyectoInvestigacion(
            codigo_proyecto=2026001,
            nombre_proyecto="Plataforma de gestion academica de prueba",
            descripcion_proyecto="Proyecto ficticio para operar el entorno testing.",
            fecha_inicio=date(2024, 1, 1),
            fecha_fin=None,
            dificultades_proyecto="Sin dificultades registradas.",
            monto_destinado=1500000,
            tipo_proyecto_id=catalogs["tipo_proyecto"].id,
            grupo_utn_id=grupo.id,
            fuente_financiamiento_id=catalogs["fuente"].id,
            created_by=admin_user_id,
        )
        db.session.add(proyecto)
        db.session.flush()

    if not InvestigadorProyecto.query.filter_by(
        id_investigador=investigador.id,
        id_proyecto=proyecto.id,
    ).first():
        db.session.add(
            InvestigadorProyecto(
                investigador=investigador,
                proyecto=proyecto,
                es_coordinador=True,
                fecha_inicio=date(2024, 1, 1),
                created_by=admin_user_id,
            )
        )

    if not BecarioProyecto.query.filter_by(
        id_becario=becario.id,
        id_proyecto=proyecto.id,
    ).first():
        db.session.add(
            BecarioProyecto(
                becario=becario,
                proyecto=proyecto,
                fecha_inicio=date(2024, 3, 1),
                created_by=admin_user_id,
            )
        )


def _seed_memoria(admin_user_id):
    memoria = Memoria.query.filter_by(
        periodo_inicio=date(2024, 1, 1),
        periodo_fin=date(2024, 12, 31),
    ).first()
    if memoria:
        return memoria

    memoria = Memoria(
        periodo_inicio=date(2024, 1, 1),
        periodo_fin=date(2024, 12, 31),
        created_by=admin_user_id,
    )
    db.session.add(memoria)
    db.session.flush()

    version = MemoriaVersion(
        memoria_id=memoria.id,
        numero_version=1,
        fecha_apertura=datetime.utcnow(),
        estado=EstadoMemoria.ABIERTA,
        created_by=admin_user_id,
    )
    db.session.add(version)
    db.session.flush()

    memoria.version_actual_id = version.id
    return memoria


def seed_testing_data():
    _assert_testing_environment()
    roles = _seed_roles()
    admin = _seed_user(
        "admin.testing",
        "admin.testing@example.com",
        "Admin Testing",
        99000001,
        roles["ADMIN"],
    )
    _seed_user(
        "gestor.testing",
        "gestor.testing@example.com",
        "Gestor Testing",
        99000002,
        roles["GESTOR"],
    )
    _seed_user(
        "lector.testing",
        "lector.testing@example.com",
        "Lector Testing",
        99000003,
        roles["LECTOR"],
    )

    catalogs = _seed_catalogs()
    grupo = _seed_group()
    investigador, becario, _personal = _seed_people(grupo, catalogs, admin.id)
    _seed_project(grupo, catalogs, investigador, becario, admin.id)
    _seed_memoria(admin.id)

    db.session.commit()

    print("Datos ficticios de testing cargados correctamente")
    print("Usuarios disponibles:")
    print(f"- admin.testing / {TEST_PASSWORD}")
    print(f"- gestor.testing / {TEST_PASSWORD}")
    print(f"- lector.testing / {TEST_PASSWORD}")


if __name__ == "__main__":
    with app.app_context():
        seed_testing_data()
