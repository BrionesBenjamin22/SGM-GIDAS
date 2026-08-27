import unittest
from unittest.mock import patch

from app import create_app
from modules.shared.exceptions import ConflictError, NotFoundError, ValidationError


class RecursosDomainErrorsTestCase(unittest.TestCase):

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

    def test_beca_expone_not_found(self):
        with self._auth("LECTURA"), patch(
            "modules.recursos.controllers.becas_controller.BecaService.get_by_id",
            side_effect=NotFoundError("Beca no encontrada"),
        ):
            response = self.client.get("/api/v1/recursos/becas/1", headers=self._headers())
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"]["code"], "NOT_FOUND")

    def test_tipo_erogacion_expone_conflicto(self):
        with self._auth(), patch(
            "modules.recursos.controllers.tipo_erogacion_controller."
            "TipoErogacionService.delete",
            side_effect=ConflictError("Tipo asociado"),
        ):
            response = self.client.delete(
                "/api/v1/recursos/tipo-erogacion/1", headers=self._headers()
            )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()["error"]["code"], "CONFLICT")

    def test_erogacion_expone_validacion(self):
        with self._auth(), patch(
            "modules.recursos.controllers.erogacion_controller.ErogacionService.create",
            side_effect=ValidationError("El body es obligatorio"),
        ):
            response = self.client.post(
                "/api/v1/recursos/erogaciones/", json={}, headers=self._headers()
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"]["code"], "VALIDATION_ERROR")

    def test_equipamiento_oculta_error_inesperado(self):
        marker = "monto privado password=secreto"
        with self._auth("LECTURA"), patch(
            "modules.recursos.controllers.equipamiento_controller."
            "EquipamientoService.get_all",
            side_effect=RuntimeError(marker),
        ):
            response = self.client.get(
                "/api/v1/recursos/equipamiento/", headers=self._headers()
            )
        body = response.get_json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(body["error"]["code"], "INTERNAL_ERROR")
        self.assertNotIn(marker, str(body))


if __name__ == "__main__":
    unittest.main()
