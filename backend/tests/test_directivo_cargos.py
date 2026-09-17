import unittest
from datetime import date, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app import create_app
from flask import Flask
from extension import db
from modules import models_registry  # noqa: F401
from modules.grupo.models.directivos import Cargo, Directivo, DirectivoGrupo
from modules.grupo.models.grupo import GrupoInvestigacionUtn
from modules.grupo.services.directivo_service import DirectivoGrupoService
from modules.shared.exceptions import ValidationError


class DirectivoAtomicTestCase(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI="sqlite:///:memory:")
        db.init_app(self.app)
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        db.session.add(GrupoInvestigacionUtn(id=1, nombre_sigla_grupo="UCT", mail="uct@test.invalid", nombre_unidad_academica="Regional", objetivo_desarrollo="Investigación"))
        db.session.add(Cargo(id=1, nombre="Director"))
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def test_creacion_y_asignacion_comparten_transaccion(self):
        payload = {"nombre_apellido": "Ada", "id_grupo_utn": 1, "id_cargo": 999, "fecha_inicio": "2025-01-01"}
        with self.assertRaises(ValidationError) as caught:
            DirectivoGrupoService.crear_y_asignar(payload, 1)
        self.assertIn("id_cargo", caught.exception.details["fields"])
        self.assertEqual(Directivo.query.count(), 0)
        payload["id_cargo"] = 1
        result = DirectivoGrupoService.crear_y_asignar(payload, 1)
        self.assertEqual(Directivo.query.count(), 1)
        self.assertEqual(DirectivoGrupo.query.filter_by(id_directivo=result["id"]).count(), 1)


class DirectivoCargosTestCase(unittest.TestCase):

    def test_endpoint_atomico_respeta_permisos(self):
        payload = {"nombre_apellido": "Ada", "id_grupo_utn": 1, "id_cargo": 1, "fecha_inicio": "2025-01-01"}
        for rol, expected in (("GESTOR", 201), ("LECTURA", 403)):
            with self.subTest(rol=rol), patch("modules.shared.services.middleware.AuthService.verify_token", return_value={"sub": "1", "rol": rol}), patch.object(DirectivoGrupoService, "crear_y_asignar", return_value={"id": 5, "nombre_apellido": "Ada"}) as create:
                response = self.app.test_client().post("/api/v1/grupo/directivos/crear-y-asignar", json=payload, headers={"Authorization": "Bearer test"})
            self.assertEqual(response.status_code, expected)
            self.assertEqual(create.call_count, int(expected == 201))

    def test_nombre_y_fecha_identifican_campos_editables(self):
        with self.assertRaises(ValidationError) as caught:
            DirectivoGrupoService.crear_directivo({"nombre_apellido": ""}, 1)
        self.assertIn("nombre_apellido", caught.exception.details["fields"])
        with self.assertRaises(ValidationError) as caught:
            DirectivoGrupoService.crear_directivo({"nombre_apellido": "22"}, 1)
        self.assertIn("nombre_apellido", caught.exception.details["fields"])
        with self.assertRaises(ValidationError) as caught:
            DirectivoGrupoService.crear_directivo({"nombre_apellido": "Ana 22"}, 1)
        self.assertIn("nombre_apellido", caught.exception.details["fields"])
        with self.assertRaises(ValidationError) as caught:
            DirectivoGrupoService._validar_fecha("invalida", "fecha_inicio")
        self.assertIn("fecha_inicio", caught.exception.details["fields"])

    def setUp(self):
        self.app = create_app()
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.addCleanup(self.app_context.pop)

    @staticmethod
    def _cargo(cargo_id: int, nombre: str) -> Cargo:
        cargo = Cargo(id=cargo_id, nombre=nombre)
        cargo.deleted_at = None
        return cargo

    @staticmethod
    def _query_con_actuales(actuales):
        query = MagicMock()
        query.filter.return_value.all.return_value = actuales
        return query

    def test_rechaza_cargo_fuera_del_equipo_institucional(self):
        cargo = self._cargo(3, "Director TEST")

        with self.assertRaisesRegex(
            ValidationError,
            "solo admite los cargos Director y Vicedirector"
        ):
            DirectivoGrupoService._validar_cargo_y_cupo(1, cargo)

    def test_fechas_de_directivos_respetan_rango_institucional(self):
        with self.assertRaisesRegex(ValidationError, "posterior al 01/01/2010"):
            DirectivoGrupoService._validar_fecha("2009-12-31", "fecha_inicio")

        self.assertEqual(
            DirectivoGrupoService._validar_fecha("2010-01-01", "fecha_inicio"),
            date(2010, 1, 1),
        )

    def test_fechas_de_directivos_no_admiten_futuro(self):
        future = (date.today() + timedelta(days=1)).isoformat()
        with self.assertRaisesRegex(ValidationError, "no puede ser futuro"):
            DirectivoGrupoService._validar_fecha(future, "fecha_inicio")

    def test_con_un_director_permite_asignar_el_vicedirector(self):
        cargo = self._cargo(2, "Vicedirector")
        query = self._query_con_actuales([
            SimpleNamespace(id_cargo=1)
        ])

        with patch.object(DirectivoGrupo, "query", query):
            DirectivoGrupoService._validar_cargo_y_cupo(1, cargo)

    def test_rechaza_un_cargo_que_ya_esta_activo(self):
        cargo = self._cargo(1, "Director")
        query = self._query_con_actuales([
            SimpleNamespace(id_cargo=1)
        ])

        with patch.object(DirectivoGrupo, "query", query), self.assertRaisesRegex(
            ValidationError,
            "ya tiene un Director activo"
        ):
            DirectivoGrupoService._validar_cargo_y_cupo(1, cargo)

    def test_rechaza_altas_si_el_equipo_ya_esta_completo(self):
        cargo = self._cargo(2, "Vicedirector")
        query = self._query_con_actuales([
            SimpleNamespace(id_cargo=1),
            SimpleNamespace(id_cargo=2),
        ])

        with patch.object(DirectivoGrupo, "query", query), self.assertRaisesRegex(
            ValidationError,
            "ya tiene completo su equipo directivo"
        ):
            DirectivoGrupoService._validar_cargo_y_cupo(1, cargo)

    def test_periodo_finalizado_no_consume_cupo_actual(self):
        cargo = self._cargo(1, "Director")
        query = self._query_con_actuales([
            SimpleNamespace(id_cargo=1),
            SimpleNamespace(id_cargo=2),
        ])

        with patch.object(DirectivoGrupo, "query", query):
            DirectivoGrupoService._validar_cargo_y_cupo(
                1,
                cargo,
                es_periodo_activo=False
            )

        query.filter.assert_not_called()

    def test_serializacion_uct_excluye_participaciones_dadas_de_baja(self):
        grupo = GrupoInvestigacionUtn(
            id=1,
            mail="uct@example.com",
            nombre_unidad_academica="Facultad",
            objetivo_desarrollo="Objetivo",
            nombre_sigla_grupo="UCT",
        )
        director = Directivo(id=1, nombre_apellido="Directora vigente")
        director.deleted_at = None
        cargo = self._cargo(1, "Director")

        vigente = DirectivoGrupo(
            id=1,
            id_directivo=1,
            id_grupo_utn=1,
            id_cargo=1,
            fecha_inicio=date(2024, 1, 1),
            directivo=director,
            cargo=cargo,
        )
        vigente.deleted_at = None

        eliminado = DirectivoGrupo(
            id=2,
            id_directivo=1,
            id_grupo_utn=1,
            id_cargo=1,
            fecha_inicio=date(2023, 1, 1),
            directivo=director,
            cargo=cargo,
        )
        eliminado.deleted_at = datetime(2026, 9, 1)
        grupo.participaciones_directivos = [vigente, eliminado]

        with patch.object(GrupoInvestigacionUtn, "to_dict", return_value={}):
            resultado = grupo.serialize()

        self.assertEqual(
            resultado["directivos"],
            [{
                "id": 1,
                "nombre_apellido": "Directora vigente",
                "cargo": "Director",
                "fecha_inicio": "2024-01-01",
            }]
        )


if __name__ == "__main__":
    unittest.main()
