import unittest
from unittest.mock import patch

from app import create_app
from modules.shared.exceptions import ValidationError


class GrupoDomainErrorsTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.testing = True
        self.client = self.app.test_client()

    @staticmethod
    def _headers():
        return {"Authorization": "Bearer fake-token", "Content-Type": "application/json"}

    def _auth(self, rol="GESTOR"):
        return patch(
            "modules.shared.services.middleware.AuthService.verify_token",
            return_value={"sub": "7", "rol": rol},
        )

    def test_opciones_uct_respeta_roles_y_contrato(self):
        for rol, status in (("ADMIN", 200), ("GESTOR", 200), ("LECTURA", 200), ("LECTOR", 403)):
            with self.subTest(rol=rol), self._auth(rol), patch(
                "modules.grupo.controllers.grupo_controller.listar_grupos_utn_activos",
                return_value=[{"id": 3, "nombre": "GIDAS"}],
            ):
                response = self.client.get(
                    "/api/v1/grupo/grupo-utn/opciones", headers=self._headers()
                )
            self.assertEqual(response.status_code, status)
            if status == 200:
                self.assertEqual(response.get_json(), [{"id": 3, "nombre": "GIDAS"}])

    def test_cargo_expone_validacion_tipificada(self):
        with self._auth(), patch(
            "modules.grupo.controllers.cargo_controller.CargoService.create",
            side_effect=ValidationError("El nombre es obligatorio"),
        ):
            response = self.client.post(
                "/api/v1/grupo/cargos/", json={}, headers=self._headers()
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"]["code"], "VALIDATION_ERROR")

    def test_cargo_oculta_error_inesperado(self):
        marker = "ruta interna password=secreto"
        with self._auth("LECTURA"), patch(
            "modules.grupo.controllers.cargo_controller.CargoService.get_all",
            side_effect=RuntimeError(marker),
        ):
            response = self.client.get(
                "/api/v1/grupo/cargos/", headers=self._headers()
            )
        body = response.get_json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(body["error"]["code"], "INTERNAL_ERROR")
        self.assertNotIn(marker, str(body))

    def test_grupo_no_configurado_usa_contrato_compartido(self):
        with self._auth("LECTURA"), patch(
            "modules.grupo.controllers.grupo_controller.obtener_grupo_utn",
            return_value=None,
        ):
            response = self.client.get(
                "/api/v1/grupo/grupo-utn/",
                headers=self._headers(),
            )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"]["code"], "NOT_FOUND")


if __name__ == "__main__":
    unittest.main()
