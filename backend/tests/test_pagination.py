import unittest
from unittest.mock import patch

from flask import Flask, request

from modules.grupo.controllers.cargo_controller import CargoController
from modules.shared.controllers.pagination import (
    paginate_list,
    paginate_query,
    parse_pagination_params,
    register_legacy_list_pagination,
)


class FakeQuery:
    def __init__(self, items):
        self.items = items
        self.offset_value = 0
        self.limit_value = None

    def count(self):
        return len(self.items)

    def offset(self, value):
        self.offset_value = value
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    def all(self):
        end = None if self.limit_value is None else self.offset_value + self.limit_value
        return self.items[self.offset_value:end]


class PaginationTestCase(unittest.TestCase):

    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(
            PAGINATION_DEFAULT_PER_PAGE=9,
            PAGINATION_MAX_PER_PAGE=20,
        )

    def test_parsea_parametros_con_defaults_del_proyecto(self):
        with self.app.test_request_context("/cargos/?page=2"):
            params = parse_pagination_params(request_args())

        self.assertEqual(
            params,
            {
                "page": 2,
                "per_page": 9,
                "activos": "true",
                "orden": "asc",
            },
        )

    def test_rechaza_per_page_superior_al_maximo(self):
        with self.app.test_request_context("/cargos/?per_page=21"):
            with self.assertRaises(ValueError) as context:
                parse_pagination_params(request_args())

        self.assertIn("per_page no puede superar 20", str(context.exception))

    def test_rechaza_activos_fuera_de_contrato(self):
        with self.app.test_request_context("/cargos/?page=1&activos=si"):
            with self.assertRaises(ValueError) as context:
                parse_pagination_params(request_args())

        self.assertIn("activos debe ser true, false o all", str(context.exception))

    def test_paginate_query_calcula_slice_y_total(self):
        items, total = paginate_query(FakeQuery([1, 2, 3, 4, 5]), page=2, per_page=2)

        self.assertEqual(items, [3, 4])
        self.assertEqual(total, 5)

    def test_paginate_list_calcula_slice_y_total(self):
        items, total = paginate_list([1, 2, 3, 4, 5], page=3, per_page=2)

        self.assertEqual(items, [5])
        self.assertEqual(total, 5)

    def test_registro_transversal_pagina_listados_legacy(self):
        register_legacy_list_pagination(self.app)

        @self.app.get("/legacy")
        def legacy_list():
            return [{"id": 1}, {"id": 2}, {"id": 3}]

        response = self.app.test_client().get("/legacy?page=2&per_page=2")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"], [{"id": 3}])
        self.assertEqual(
            response.get_json()["meta"],
            {
                "page": 2,
                "per_page": 2,
                "total": 3,
                "total_pages": 2,
                "activos": "true",
                "orden": "asc",
                "source": "legacy-list",
            },
        )
        self.assertIsNone(response.get_json()["error"])

    def test_registro_transversal_no_toca_listados_legacy_sin_paginacion(self):
        register_legacy_list_pagination(self.app)

        @self.app.get("/legacy-sin-paginacion")
        def legacy_list():
            return [{"id": 1}, {"id": 2}]

        response = self.app.test_client().get("/legacy-sin-paginacion")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [{"id": 1}, {"id": 2}])

    def test_registro_transversal_no_toca_contrato_paginado_existente(self):
        register_legacy_list_pagination(self.app)

        @self.app.get("/contrato")
        def contract_response():
            return {
                "data": [{"id": 1}],
                "meta": {
                    "page": 1,
                    "per_page": 9,
                    "total": 1,
                    "total_pages": 1,
                },
                "error": None,
            }

        response = self.app.test_client().get("/contrato?page=1&per_page=9")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"], [{"id": 1}])
        self.assertIsNone(response.get_json()["error"])

    def test_registro_transversal_devuelve_error_si_parametros_invalidos(self):
        register_legacy_list_pagination(self.app)

        @self.app.get("/legacy-error")
        def legacy_list():
            return [{"id": 1}]

        response = self.app.test_client().get("/legacy-error?page=0")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"]["code"], "VALIDATION_ERROR")

    def test_cargo_controller_devuelve_contrato_paginado_si_se_solicita(self):
        with self.app.test_request_context(
            "/cargos/?page=2&per_page=9&activos=all&orden=desc"
        ):
            with patch(
                "modules.grupo.controllers.cargo_controller.CargoService.get_page",
                return_value=([{"id": 10, "nombre": "Secretario"}], 19),
            ):
                response, status_code = CargoController.get_all()

        body = response.get_json()
        self.assertEqual(status_code, 200)
        self.assertEqual(body["data"], [{"id": 10, "nombre": "Secretario"}])
        self.assertEqual(
            body["meta"],
            {
                "page": 2,
                "per_page": 9,
                "total": 19,
                "total_pages": 3,
                "activos": "all",
                "orden": "desc",
            },
        )
        self.assertIsNone(body["error"])

    def test_cargo_controller_mantiene_lista_legacy_sin_paginacion(self):
        with self.app.test_request_context("/cargos/?activos=false"):
            with patch(
                "modules.grupo.controllers.cargo_controller.CargoService.get_all",
                return_value=[{"id": 1, "nombre": "Director"}],
            ):
                response, status_code = CargoController.get_all()

        self.assertEqual(status_code, 200)
        self.assertEqual(response.get_json(), [{"id": 1, "nombre": "Director"}])


def request_args():
    return request.args


if __name__ == "__main__":
    unittest.main()
