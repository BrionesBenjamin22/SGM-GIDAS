import unittest
from unittest.mock import patch

from app import create_app
from modules.shared.exceptions import ConflictError, NotFoundError, ValidationError


class ProduccionDomainErrorsTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.testing = True
        self.client = self.app.test_client()

    @staticmethod
    def _headers():
        return {
            "Authorization": "Bearer fake-token",
            "Content-Type": "application/json",
        }

    def _auth(self, rol="GESTOR"):
        return patch(
            "modules.shared.services.middleware.AuthService.verify_token",
            return_value={"sub": "7", "rol": rol},
        )

    def test_autor_expone_validacion_tipificada(self):
        with self._auth(), patch(
            "modules.produccion.controllers.autores_controller.AutorService.create",
            side_effect=ValidationError("El nombre es obligatorio"),
        ):
            response = self.client.post(
                "/api/v1/produccion/autores/",
                json={},
                headers=self._headers(),
            )

        body = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(body["error"]["code"], "VALIDATION_ERROR")
        self.assertEqual(body["error"]["message"], "El nombre es obligatorio")

    def test_autor_expone_conflicto_tipificado(self):
        with self._auth(), patch(
            "modules.produccion.controllers.autores_controller.AutorService.delete",
            side_effect=ConflictError("El autor tiene libros asociados"),
        ):
            response = self.client.delete(
                "/api/v1/produccion/autores/1",
                headers=self._headers(),
            )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()["error"]["code"], "CONFLICT")

    def test_documentacion_expone_not_found_tipificado(self):
        with self._auth("LECTURA"), patch(
            "modules.produccion.controllers.documentacion_controller."
            "DocumentacionBibliograficaService.get_by_id",
            side_effect=NotFoundError("Documentacion bibliografica no encontrada"),
        ):
            response = self.client.get(
                "/api/v1/produccion/documentacion-bibliografica/1",
                headers=self._headers(),
            )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"]["code"], "NOT_FOUND")

    def test_documentacion_oculta_error_inesperado(self):
        marker = "postgresql://usuario:secreto@db/interna"
        with self._auth("LECTURA"), patch(
            "modules.produccion.controllers.documentacion_controller."
            "DocumentacionBibliograficaService.get_all",
            side_effect=RuntimeError(marker),
        ):
            response = self.client.get(
                "/api/v1/produccion/documentacion-bibliografica",
                headers=self._headers(),
            )

        body = response.get_json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(body["error"]["code"], "INTERNAL_ERROR")
        self.assertNotIn(marker, str(body))

    def test_tipo_registro_expone_conflicto_tipificado(self):
        with self._auth(), patch(
            "modules.produccion.controllers.tipo_registro_controller."
            "TipoRegistroPropiedadService.create",
            side_effect=ConflictError("Ya existe un tipo de registro con ese nombre"),
        ):
            response = self.client.post(
                "/api/v1/produccion/tipo-registro-propiedad/",
                json={"nombre": "Patente"},
                headers=self._headers(),
            )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()["error"]["code"], "CONFLICT")

    def test_tipo_registro_oculta_error_inesperado(self):
        marker = "driver interno con password=secreto"
        with self._auth("LECTURA"), patch(
            "modules.produccion.controllers.tipo_registro_controller."
            "TipoRegistroPropiedadService.get_all",
            side_effect=RuntimeError(marker),
        ):
            response = self.client.get(
                "/api/v1/produccion/tipo-registro-propiedad/",
                headers=self._headers(),
            )

        body = response.get_json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(body["error"]["code"], "INTERNAL_ERROR")
        self.assertNotIn(marker, str(body))

    def test_grado_academico_expone_not_found_sin_inferir_texto(self):
        with self._auth("LECTURA"), patch(
            "modules.produccion.controllers.grado_academico_controller."
            "GradoAcademicoService.get_by_id",
            side_effect=NotFoundError("Grado ausente"),
        ):
            response = self.client.get(
                "/api/v1/produccion/grado-academico/1",
                headers=self._headers(),
            )

        body = response.get_json()
        self.assertEqual(response.status_code, 404)
        self.assertEqual(body["error"]["code"], "NOT_FOUND")
        self.assertEqual(body["error"]["message"], "Grado ausente")

    def test_grado_academico_expone_validacion_tipificada(self):
        with self._auth(), patch(
            "modules.produccion.controllers.grado_academico_controller."
            "GradoAcademicoService.update",
            side_effect=ValidationError("El nombre es obligatorio"),
        ):
            response = self.client.put(
                "/api/v1/produccion/grado-academico/1",
                json={"nombre": ""},
                headers=self._headers(),
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"]["code"], "VALIDATION_ERROR")


if __name__ == "__main__":
    unittest.main()
