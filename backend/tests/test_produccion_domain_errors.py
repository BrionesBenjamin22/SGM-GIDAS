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

    def test_rol_actividad_expone_conflicto_tipificado(self):
        with self._auth(), patch(
            "modules.produccion.controllers.rol_actividad_controller."
            "RolActividadService.delete",
            side_effect=ConflictError("El rol tiene actividades asociadas"),
        ):
            response = self.client.delete(
                "/api/v1/produccion/rol-actividad/1",
                headers=self._headers(),
            )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()["error"]["code"], "CONFLICT")

    def test_tipo_reunion_oculta_error_inesperado(self):
        marker = "sqlalchemy password=secreto"
        with self._auth("LECTURA"), patch(
            "modules.produccion.controllers.tipo_reunion_controller."
            "TipoReunionService.get_all",
            side_effect=RuntimeError(marker),
        ):
            response = self.client.get(
                "/api/v1/produccion/tipos-reunion-cientifica/",
                headers=self._headers(),
            )

        body = response.get_json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(body["error"]["code"], "INTERNAL_ERROR")
        self.assertNotIn(marker, str(body))

    def test_articulo_expone_not_found_tipificado(self):
        with self._auth("LECTURA"), patch(
            "modules.produccion.controllers.articulo_divulgacion_controller."
            "ArticuloDivulgacionService.get_by_id",
            side_effect=NotFoundError("Articulo no encontrado"),
        ):
            response = self.client.get(
                "/api/v1/produccion/articulos-divulgacion/1",
                headers=self._headers(),
            )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"]["code"], "NOT_FOUND")

    def test_distincion_expone_conflicto_tipificado(self):
        with self._auth(), patch(
            "modules.produccion.controllers.distincion_controller."
            "DistincionRecibidaService.create",
            side_effect=ConflictError("Ya existe una distincion identica"),
        ):
            response = self.client.post(
                "/api/v1/produccion/distinciones/",
                json={"nombre": "Premio"},
                headers=self._headers(),
            )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()["error"]["code"], "CONFLICT")

    def test_registro_propiedad_oculta_error_inesperado(self):
        marker = "driver interno password=secreto"
        with self._auth("LECTURA"), patch(
            "modules.produccion.controllers.registro_propiedad_controller."
            "RegistrosPropiedadService.get_all",
            side_effect=RuntimeError(marker),
        ):
            response = self.client.get(
                "/api/v1/produccion/registros-propiedad/",
                headers=self._headers(),
            )

        body = response.get_json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(body["error"]["code"], "INTERNAL_ERROR")
        self.assertNotIn(marker, str(body))

    def test_actividad_docencia_expone_not_found_tipificado(self):
        with self._auth("LECTURA"), patch(
            "modules.produccion.controllers.actividad_docencia_controller."
            "ActividadDocenciaService.get_by_id",
            side_effect=NotFoundError("Actividad de docencia no encontrada"),
        ):
            response = self.client.get(
                "/api/v1/produccion/actividades-docencia/1",
                headers=self._headers(),
            )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"]["code"], "NOT_FOUND")

    def test_actividad_docencia_expone_conflicto_tipificado(self):
        with self._auth(), patch(
            "modules.produccion.controllers.actividad_docencia_controller."
            "ActividadDocenciaService.update",
            side_effect=ConflictError("No se puede cambiar el investigador"),
        ):
            response = self.client.put(
                "/api/v1/produccion/actividades-docencia/1",
                json={"investigador_id": 2},
                headers=self._headers(),
            )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()["error"]["code"], "CONFLICT")

    def test_actividad_docencia_oculta_error_inesperado(self):
        marker = "postgresql password=secreto"
        with self._auth("LECTURA"), patch(
            "modules.produccion.controllers.actividad_docencia_controller."
            "ActividadDocenciaService.get_all",
            side_effect=RuntimeError(marker),
        ):
            response = self.client.get(
                "/api/v1/produccion/actividades-docencia",
                headers=self._headers(),
            )

        body = response.get_json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(body["error"]["code"], "INTERNAL_ERROR")
        self.assertNotIn(marker, str(body))

    def test_trabajo_reunion_expone_not_found_tipificado(self):
        with self._auth("LECTURA"), patch(
            "modules.produccion.controllers.trabajo_reunion_controller."
            "TrabajoReunionCientificaService.get_by_id",
            side_effect=NotFoundError("Trabajo en reunion no encontrado"),
        ):
            response = self.client.get(
                "/api/v1/produccion/trabajos-reunion-cientifica/1",
                headers=self._headers(),
            )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["error"]["code"], "NOT_FOUND")

    def test_trabajo_reunion_oculta_error_inesperado(self):
        marker = "conexion interna password=secreto"
        with self._auth("LECTURA"), patch(
            "modules.produccion.controllers.trabajo_reunion_controller."
            "TrabajoReunionCientificaService.get_all",
            side_effect=RuntimeError(marker),
        ):
            response = self.client.get(
                "/api/v1/produccion/trabajos-reunion-cientifica",
                headers=self._headers(),
            )

        body = response.get_json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(body["error"]["code"], "INTERNAL_ERROR")
        self.assertNotIn(marker, str(body))

    def test_trabajo_revista_expone_conflicto_tipificado(self):
        with self._auth(), patch(
            "modules.produccion.controllers.trabajo_revista_controller."
            "TrabajosRevistasReferatoService.restore",
            side_effect=ConflictError("El trabajo ya se encuentra activo"),
        ):
            response = self.client.put(
                "/api/v1/produccion/trabajos-revistas/1/restore",
                headers=self._headers(),
            )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.get_json()["error"]["code"], "CONFLICT")

    def test_trabajo_revista_oculta_error_inesperado(self):
        marker = "sql interna token=secreto"
        with self._auth("LECTURA"), patch(
            "modules.produccion.controllers.trabajo_revista_controller."
            "TrabajosRevistasReferatoService.get_all",
            side_effect=RuntimeError(marker),
        ):
            response = self.client.get(
                "/api/v1/produccion/trabajos-revistas/",
                headers=self._headers(),
            )

        body = response.get_json()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(body["error"]["code"], "INTERNAL_ERROR")
        self.assertNotIn(marker, str(body))


if __name__ == "__main__":
    unittest.main()
