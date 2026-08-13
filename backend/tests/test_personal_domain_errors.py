import unittest
from unittest.mock import patch

from app import create_app
from modules.shared.exceptions import ConflictError, NotFoundError, ValidationError


class PersonalDomainErrorsTestCase(unittest.TestCase):

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

    def test_tipo_personal_expone_validacion_tipificada(self):
        with self._auth(), patch(
            "modules.personal.controllers.tipo_personal_controller.crear_tipo_personal",
            side_effect=ValidationError("El nombre es obligatorio"),
        ):
            response = self.client.post(
                "/api/v1/personal/tipo-personal/", json={}, headers=self._headers()
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"]["code"], "VALIDATION_ERROR")

    def test_tipo_formacion_expone_not_found_tipificado(self):
        with self._auth("LECTURA"), patch(
            "modules.personal.controllers.tipo_formacion_controller."
            "obtener_tipo_formacion_por_id",
            side_effect=NotFoundError("Tipo de formacion no encontrado"),
        ):
            response = self.client.get(
                "/api/v1/personal/tipo-formacion/1", headers=self._headers()
            )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"]["code"], "NOT_FOUND")

    def test_tipo_dedicacion_expone_conflicto_tipificado(self):
        with self._auth(), patch(
            "modules.personal.controllers.tipo_dedicacion_controller."
            "eliminar_tipo_dedicacion",
            side_effect=ConflictError("El tipo esta asociado"),
        ):
            response = self.client.delete(
                "/api/v1/personal/tipo-dedicacion/1", headers=self._headers()
            )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()["error"]["code"], "CONFLICT")

    def test_catalogo_personal_oculta_error_inesperado(self):
        marker = "postgresql password=secreto"
        with self._auth("LECTURA"), patch(
            "modules.personal.controllers.tipo_formacion_controller."
            "listar_tipos_formacion",
            side_effect=RuntimeError(marker),
        ):
            response = self.client.get(
                "/api/v1/personal/tipo-formacion/", headers=self._headers()
            )

        body = response.get_json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(body["error"]["code"], "INTERNAL_ERROR")
        self.assertNotIn(marker, str(body))

    def test_investigador_expone_not_found_tipificado(self):
        with self._auth("LECTURA"), patch(
            "modules.personal.controllers.investigador_controller."
            "obtener_investigador_por_id",
            side_effect=NotFoundError("Investigador no encontrado"),
        ):
            response = self.client.get(
                "/api/v1/personal/investigadores/1", headers=self._headers()
            )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"]["code"], "NOT_FOUND")

    def test_becario_expone_conflicto_tipificado(self):
        with self._auth(), patch(
            "modules.personal.controllers.becario_controller.eliminar_becario",
            side_effect=ConflictError("El becario ya esta eliminado"),
        ):
            response = self.client.delete(
                "/api/v1/personal/becarios/1", headers=self._headers()
            )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()["error"]["code"], "CONFLICT")

    def test_personal_oculta_error_inesperado(self):
        marker = "documento=12345678 password=secreto"
        with self._auth("LECTURA"), patch(
            "modules.personal.controllers.personal_controller.listar_personal",
            side_effect=RuntimeError(marker),
        ):
            response = self.client.get("/api/v1/personal", headers=self._headers())

        body = response.get_json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(body["error"]["code"], "INTERNAL_ERROR")
        self.assertNotIn(marker, str(body))

    def test_personal_completo_oculta_error_inesperado(self):
        marker = "correo=privado@example.com"
        with self._auth("LECTURA"), patch(
            "modules.personal.controllers.personal_completo_controller."
            "listar_personal_completo",
            side_effect=RuntimeError(marker),
        ):
            response = self.client.get(
                "/api/v1/personal/all", headers=self._headers()
            )

        body = response.get_json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(body["error"]["code"], "INTERNAL_ERROR")
        self.assertNotIn(marker, str(body))


if __name__ == "__main__":
    unittest.main()
