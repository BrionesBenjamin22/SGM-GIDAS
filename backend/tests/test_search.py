import unittest
from unittest.mock import patch

from flask import Flask

from modules.search.controllers.search_controller import SearchController
from modules.search.services.search_service import SearchService


class _FakeColumn:
    def __init__(self, name):
        self.name = name

    def asc(self):
        return ("asc", self.name)

    def is_(self, value):
        return ("is", self.name, value)

    def isnot(self, value):
        return ("isnot", self.name, value)


class _FakeModel:
    id = _FakeColumn("id")
    deleted_at = _FakeColumn("deleted_at")


class _FakeQuery:
    def __init__(self):
        self.calls = []

    def filter(self, *criteria):
        self.calls.append(("filter", criteria))
        return self

    def order_by(self, *criteria):
        self.calls.append(("order_by", criteria))
        return self

    def limit(self, value):
        self.calls.append(("limit", value))
        return self

    def all(self):
        self.calls.append(("all",))
        return ["resultado"]


class SearchServiceTestCase(unittest.TestCase):

    def test_bounded_results_filtra_activos_y_limita_consulta(self):
        query = _FakeQuery()

        results = SearchService.bounded_results(
            query,
            _FakeModel,
            eliminados="false",
            max_scan_per_model=25,
        )

        self.assertEqual(results, ["resultado"])
        self.assertEqual(
            query.calls,
            [
                ("filter", (("is", "deleted_at", None),)),
                ("order_by", (("asc", "id"),)),
                ("limit", 25),
                ("all",),
            ],
        )

    def test_bounded_results_filtra_eliminados(self):
        query = _FakeQuery()

        SearchService.bounded_results(
            query,
            _FakeModel,
            eliminados="true",
            max_scan_per_model=10,
        )

        self.assertEqual(query.calls[0], ("filter", (("isnot", "deleted_at", None),)))

    def test_bounded_results_no_filtra_estado_en_all(self):
        query = _FakeQuery()

        SearchService.bounded_results(
            query,
            _FakeModel,
            eliminados="all",
            max_scan_per_model=10,
        )

        self.assertNotEqual(query.calls[0][0], "filter")


class SearchControllerTestCase(unittest.TestCase):

    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(
            SEARCH_MAX_PER_PAGE=3,
            SEARCH_MAX_QUERY_LENGTH=10,
            SEARCH_MAX_SCAN_PER_MODEL=30,
        )

    def test_buscar_pagina_resultados_y_devuelve_meta(self):
        resultados = [
            {"id": 1, "titulo": "Alpha"},
            {"id": 2, "titulo": "Beta"},
            {"id": 3, "titulo": "Gamma"},
            {"id": 4, "titulo": "Delta"},
        ]

        with self.app.test_request_context("/search/?q=al&page=2&per_page=2"):
            with patch(
                "modules.search.controllers.search_controller.SearchService.search",
                return_value=resultados,
            ) as mock_search:
                response, status_code = SearchController.buscar()

        body = response.get_json()
        self.assertEqual(status_code, 200)
        self.assertEqual(body["resultados"], resultados[2:4])
        self.assertEqual(
            body["meta"],
            {"page": 2, "per_page": 2, "total": 4, "total_pages": 2},
        )
        mock_search.assert_called_once_with(
            query_text="al",
            orden="alf_asc",
            eliminados="false",
            max_scan_per_model=30,
        )

    def test_buscar_limita_per_page_al_maximo_configurado(self):
        resultados = [{"id": index, "titulo": f"Resultado {index}"} for index in range(5)]

        with self.app.test_request_context("/search/?q=al&per_page=99"):
            with patch(
                "modules.search.controllers.search_controller.SearchService.search",
                return_value=resultados,
            ):
                response, status_code = SearchController.buscar()

        body = response.get_json()
        self.assertEqual(status_code, 200)
        self.assertEqual(len(body["resultados"]), 3)
        self.assertEqual(body["meta"]["per_page"], 3)

    def test_buscar_rechaza_consulta_demasiado_larga(self):
        with self.app.test_request_context("/search/?q=consulta-demasiado-larga"):
            response, status_code = SearchController.buscar()

        self.assertEqual(status_code, 400)
        self.assertIn("demasiado largo", response.get_json()["error"])

    def test_buscar_rechaza_page_no_numerica(self):
        with self.app.test_request_context("/search/?q=al&page=abc"):
            response, status_code = SearchController.buscar()

        self.assertEqual(status_code, 400)
        self.assertEqual(response.get_json()["error"], 'El parametro "page" debe ser numerico')


if __name__ == "__main__":
    unittest.main()
