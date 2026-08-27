import unittest
from unittest.mock import patch

from app import create_app
from modules.shared.exceptions import NotFoundError, ValidationError


class TransferenciaDomainErrorsTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.testing = True
        self.client = self.app.test_client()

    @staticmethod
    def _headers():
        return {"Authorization": "Bearer fake-token", "Content-Type": "application/json"}

    def _auth(self, rol="GESTOR"):
        return patch("modules.shared.services.middleware.AuthService.verify_token", return_value={"sub": "7", "rol": rol})

    def test_adoptante_expone_validacion_tipificada(self):
        with self._auth(), patch("modules.transferencia.controllers.adoptante_controller.AdoptanteService.create", side_effect=ValidationError("Nombre obligatorio")):
            response = self.client.post("/api/v1/transferencia/adoptantes", json={"nombre": "x"}, headers=self._headers())
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"]["code"], "VALIDATION_ERROR")

    def test_transferencia_expone_recurso_inexistente(self):
        with self._auth("LECTURA"), patch("modules.transferencia.controllers.transferencia_socio_controller.TransferenciaSocioProductivaService.get_by_id", side_effect=NotFoundError("Transferencia no encontrada")):
            response = self.client.get("/api/v1/transferencia/transferencias/1", headers=self._headers())
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"]["code"], "NOT_FOUND")

    def test_transferencia_oculta_error_inesperado(self):
        marker = "mysql://interno password=secreto"
        with self._auth("LECTURA"), patch("modules.transferencia.controllers.transferencia_socio_controller.TransferenciaSocioProductivaService.get_all", side_effect=RuntimeError(marker)):
            response = self.client.get("/api/v1/transferencia/transferencias/", headers=self._headers())
        body = response.get_json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(body["error"]["code"], "INTERNAL_ERROR")
        self.assertNotIn(marker, str(body))


if __name__ == "__main__":
    unittest.main()
