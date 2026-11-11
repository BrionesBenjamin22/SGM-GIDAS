import unittest

from flask import g
from openpyxl import load_workbook
from unittest.mock import patch

from extension import db
from modules.memorias.routes.memorias_rutas import memoria_bp
from modules.memorias.services.exportacion_service_impl import ExportService
from modules.memorias.services.memoria_service import MemoriaService
from modules.personal.models.personal import Personal
from modules.personal.models.tipo_personal import TipoPersonal
from modules.personal.services.personal_service import actualizar_personal, crear_personal
from modules.personal.services.reclasificacion_service import reclasificar_personal
from modules.personal.services.tipo_personal_service import actualizar_tipo_personal
from modules.shared.exceptions import ConflictError, NotFoundError, ValidationError
from modules.shared.services.tenant_scope import register_tenant_orm_policy
from tests import test_personal_alta_ptaa as fixtures


class VinculoProfesionalTest(unittest.TestCase):
    setUp = fixtures.PersonalAltaPTAATest.setUp
    tearDown = fixtures.PersonalAltaPTAATest.tearDown
    payload = fixtures.PersonalAltaPTAATest.payload
    post = fixtures.PersonalAltaPTAATest.post
    headers = {"Authorization": "Bearer test"}

    def test_alta_y_detalle_con_validacion_del_catalogo(self):
        for value in (None, "interno ", "otro", [], 1):
            with self.subTest(value=value):
                response = self.post(self.payload(tipo_personal_id=2, vinculo_profesional=value))
                self.assertEqual(response.status_code, 400)
                self.assertIn("vinculo_profesional", response.json["error"]["details"]["fields"])
        self.assertEqual(self.post(self.payload(vinculo_profesional="externo")).status_code, 400)
        self.assertTrue(db.session.get(TipoPersonal, 2).serialize()["es_profesional"])
        self.assertFalse(db.session.get(TipoPersonal, 1).serialize()["es_profesional"])

        for value, dni, cuil in (("interno", "12345678", "20-12345678-6"),
                                 ("externo", "12345679", "20-12345679-4")):
            with self.subTest(value=value):
                response = self.post(self.payload(tipo_personal_id=2, vinculo_profesional=value, dni=dni, cuil=cuil))
                self.assertEqual(response.status_code, 201, response.json)
                ficha = response.json
                detail = self.client.get(f"/api/v1/personal/personal/{ficha['id']}", headers=self.headers)
                self.assertEqual(detail.json["vinculo_profesional"], value)
                self.assertTrue(detail.json["es_profesional"])

    def test_edicion_heredada_cambio_de_funcion_y_auditoria(self):
        ficha = crear_personal(self.payload(), 1)
        ruta = f"/api/v1/personal/personal/{ficha.id}"
        self.assertEqual(self.client.put(ruta, json={"tipo_personal_id": 2}, headers=self.headers).status_code, 400)
        ficha.tipo_personal_id = 2  # Registro profesional anterior a la migración.
        db.session.commit()
        editada = self.client.put(ruta, json={"horas_semanales": 25}, headers=self.headers)
        self.assertEqual(editada.status_code, 200)
        self.assertIsNone(editada.json["vinculo_profesional"])

        for value in ("interno", "externo"):
            response = self.client.put(ruta, json={"vinculo_profesional": value}, headers=self.headers)
            self.assertEqual(response.status_code, 200, response.json)
        self.assertEqual(self.client.put(ruta, json={"vinculo_profesional": None}, headers=self.headers).status_code, 400)
        response = self.client.put(ruta, json={"tipo_personal_id": 1}, headers=self.headers)
        self.assertIsNone(response.json["vinculo_profesional"])
        self.assertFalse(response.json["es_profesional"])
        historial = self.client.get(f"{ruta}/historial", headers=self.headers).json
        cambios = {(item["valor_anterior"], item["valor_nuevo"])
                   for item in historial if item["campo"] == "vinculo_profesional"}
        self.assertEqual(cambios, {(None, "interno"), ("interno", "externo"), ("externo", None)})

    def test_reclasificacion_desde_becario_e_investigador(self):
        ficha = crear_personal(self.payload(tipo_personal_id=2, vinculo_profesional="externo"), 1)
        for rol, referencia in (("becario", "tipo_formacion_id"), ("investigador", "tipo_dedicacion_id")):
            origen = reclasificar_personal("personal", ficha.id, {"clase_destino": rol, referencia: 1}, 1)
            destino = {"clase_destino": "personal", "tipo_personal_id": 2}
            with self.assertRaises(ValidationError):
                reclasificar_personal(rol, origen["id"], destino, 1)
            resultado = reclasificar_personal(rol, origen["id"], {**destino, "vinculo_profesional": "interno"}, 1)
            self.assertEqual(resultado["vinculo_profesional"], "interno")
            ficha = db.session.get(Personal, resultado["id"])

    def test_catalogo_global_permiso_y_aislamiento(self):
        ficha = crear_personal(self.payload(tipo_personal_id=2, vinculo_profesional="interno"), 1)
        ficha_id = ficha.id
        ruta = f"/api/v1/personal/personal/{ficha_id}"
        with patch("modules.shared.services.middleware.AuthService.verify_token",
                   return_value={"sub": "1", "rol": "LECTURA"}):
            self.assertEqual(self.client.put(ruta, json={"vinculo_profesional": "externo"},
                                             headers=self.headers).status_code, 403)
        register_tenant_orm_policy()
        db.session.remove()
        with self.app.test_request_context("/personal"):
            g.current_grupo_utn_id = 2
            with self.assertRaises(NotFoundError):
                actualizar_personal(ficha_id, {"vinculo_profesional": "externo"}, "personal", 1)
            with self.assertRaises(ConflictError):
                actualizar_tipo_personal(2, {"nombre": "Apoyo"}, 1)
            tipo = actualizar_tipo_personal(2, {"nombre": "Personal profesional de laboratorio"}, 1)
            self.assertTrue(tipo.serialize()["es_profesional"])

    def test_cierre_de_versiones_y_excel_institucional(self):
        self.app.register_blueprint(memoria_bp, url_prefix="/api/v1/memorias")
        ficha = crear_personal(self.payload(tipo_personal_id=2, vinculo_profesional="interno"), 1)
        memoria = MemoriaService.create({"grupo_utn_id": 1, "periodo_inicio": "2026-01-01",
                                         "periodo_fin": "2026-12-31"}, 1)
        memoria_id = memoria["id"]
        excels = []
        for vinculo in ("interno", "externo"):
            MemoriaService.change_status(memoria_id, {"estado": "en revision"}, 1)
            cerrada = MemoriaService.change_status(memoria_id, {"estado": "cerrada"}, 1)
            version_id = cerrada["version_actual"]["id"]
            ruta = f"/api/v1/memorias/{memoria_id}/versiones/{version_id}/personal"
            respuesta = self.client.get(ruta, headers=self.headers)
            self.assertEqual(respuesta.status_code, 200, respuesta.json)
            self.assertEqual(respuesta.json[0]["vinculo_profesional"], vinculo)
            self.assertTrue(respuesta.json[0]["es_profesional"])
            workbook = load_workbook(ExportService.generar_excel_memoria(memoria_id, version_id))
            planilla = workbook.worksheets[0]
            self.assertIn("2.2", str(planilla["A70"].value))
            self.assertEqual(planilla["B72"].value, respuesta.json[0]["nombre_apellido"])
            self.assertEqual(planilla["C72"].value, ficha.horas_semanales)
            excels.append(tuple(cell.value for row in planilla["A70":"F73"] for cell in row))
            if vinculo == "interno":
                ruta_primera = ruta
                actualizar_personal(ficha.id, {"vinculo_profesional": "externo"}, "personal", 1)
                MemoriaService.reopen(memoria_id, 1)
        self.assertEqual(self.client.get(ruta_primera, headers=self.headers).json[0]["vinculo_profesional"], "interno")
        self.assertEqual(excels[0], excels[1])
