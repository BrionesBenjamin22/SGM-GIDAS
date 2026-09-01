import unittest
from datetime import date, datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app import create_app
from modules.grupo.models.directivos import Cargo, Directivo, DirectivoGrupo
from modules.grupo.models.grupo import GrupoInvestigacionUtn
from modules.grupo.services.directivo_service import DirectivoGrupoService
from modules.shared.exceptions import ValidationError


class DirectivoCargosTestCase(unittest.TestCase):

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
