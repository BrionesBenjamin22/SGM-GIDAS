import unittest
from datetime import date
from unittest.mock import patch

from flask import Flask
from extension import db
from modules import models_registry  # noqa: F401
from modules.personal.models.personal import Investigador, Becario
from modules.proyectos.models.proyecto_investigacion import ProyectoInvestigacion, InvestigadorProyecto, TipoProyecto
from modules.proyectos.routes.proyecto_investigacion_rutas import proyecto_investigacion_bp
from modules.shared.models.auditoria_campo import AuditoriaCampo
from modules.personal.services.investigador_service import listar_investigadores


class ProyectoCoordinadorTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI="sqlite:///:memory:")
        db.init_app(self.app)
        self.app.register_blueprint(proyecto_investigacion_bp, url_prefix="/api/v1/proyectos")
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        db.session.add_all([
            TipoProyecto(id=1, nombre="Investigación", activo=True),
            Investigador(id=1, nombre_apellido="Coordinador A", horas_semanales=20, activo=True),
            Investigador(id=2, nombre_apellido="Coordinador B", horas_semanales=20, activo=True),
            Investigador(id=3, nombre_apellido="Inactivo", horas_semanales=20, activo=False),
            Investigador(id=4, nombre_apellido="Baja", horas_semanales=20, activo=True, deleted_at=date(2026, 1, 1)),
            Becario(id=5, nombre_apellido="Becario", horas_semanales=20, activo=True, tipo_formacion_id=1),
        ])
        db.session.commit()
        self.client = self.app.test_client()
        self.auth = patch("modules.shared.services.middleware.AuthService.verify_token", return_value={"sub": "7", "rol": "GESTOR"})
        self.auth.start()
        self.addCleanup(self.auth.stop)
        self.headers = {"Authorization": "Bearer test"}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def create(self, **changes):
        return self.client.post("/api/v1/proyectos", headers=self.headers, json={
            "codigo_proyecto": "ABC1", "nombre_proyecto": "Proyecto",
            "descripcion_proyecto": "Descripción", "fecha_inicio": "2026-01-01",
            "tipo_proyecto_id": 1, "investigadores_ids": [1, 2], "coordinador_id": 1,
            **changes,
        })

    def update(self, id, data):
        return self.client.put(f"/api/v1/proyectos/{id}", headers=self.headers, json=data)

    def test_asignacion_y_consulta_posterior(self):
        response = self.create()
        self.assertEqual(response.status_code, 201, response.get_json())
        id = response.get_json()["id"]
        detail = self.client.get(f"/api/v1/proyectos/{id}", headers=self.headers).get_json()
        self.assertEqual(next(i["id"] for i in detail["investigadores"] if i["es_coordinador"]), 1)
        self.assertTrue(AuditoriaCampo.query.filter_by(campo="coordinador_id").first())

    def test_candidatos_invalidos_no_dejan_proyecto_parcial(self):
        for id in (999, 3, 4, 5, 0, True):
            with self.subTest(id=id):
                response = self.create(investigadores_ids=[id], coordinador_id=id)
                self.assertEqual(response.status_code, 400, response.get_json())
                self.assertEqual(ProyectoInvestigacion.query.count(), 0)
                self.assertEqual(InvestigadorProyecto.query.count(), 0)
                self.assertEqual(AuditoriaCampo.query.count(), 0)

    def test_reemplazo_preserva_participaciones_y_fecha(self):
        id = self.create().get_json()["id"]
        rows = [(p.id, p.fecha_inicio) for p in InvestigadorProyecto.query.order_by(InvestigadorProyecto.id)]
        response = self.update(id, {"coordinador_id": 2})
        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertEqual(rows, [(p.id, p.fecha_inicio) for p in InvestigadorProyecto.query.order_by(InvestigadorProyecto.id)])
        self.assertEqual(InvestigadorProyecto.query.filter_by(es_coordinador=True, deleted_at=None).count(), 1)
        self.assertEqual(InvestigadorProyecto.query.filter_by(es_coordinador=True).first().id_investigador, 2)

    def test_edicion_sin_coordinador_conserva_asignacion(self):
        id = self.create().get_json()["id"]
        response = self.update(id, {"nombre_proyecto": "Otro nombre"})
        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertEqual(InvestigadorProyecto.query.filter_by(es_coordinador=True).first().id_investigador, 1)

    def test_baja_del_coordinador_conservacion_y_reemplazo(self):
        id = self.create().get_json()["id"]
        persona = db.session.get(Investigador, 1)
        persona.activo = False
        persona.soft_delete(7)
        db.session.commit()
        self.assertEqual(self.update(id, {"nombre_proyecto": "Conservado"}).status_code, 200)
        response = self.update(id, {"coordinador_id": 2, "investigadores_ids": [2]})
        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertIsNotNone(InvestigadorProyecto.query.filter_by(id_investigador=1).first().deleted_at)

    def test_rollback_de_campos_relaciones_e_historial(self):
        id = self.create().get_json()["id"]
        previous = AuditoriaCampo.query.count()
        with patch("modules.proyectos.services.proyecto_guardado_service.AuditoriaService.registrar_evento_relacion", side_effect=RuntimeError("fallo")):
            response = self.update(id, {"nombre_proyecto": "No persistir", "investigadores_ids": [2], "coordinador_id": 2})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(db.session.get(ProyectoInvestigacion, id).nombre_proyecto, "Proyecto")
        self.assertEqual(InvestigadorProyecto.query.filter_by(deleted_at=None).count(), 2)
        self.assertEqual(AuditoriaCampo.query.count(), previous)

    def test_rechaza_duplicados_coordinador_externo_y_null(self):
        for changes in ({"investigadores_ids": [1, 1]}, {"coordinador_id": 3}, {"coordinador_id": None}):
            self.assertEqual(self.create(**changes).status_code, 400)
            self.assertEqual(ProyectoInvestigacion.query.count(), 0)

    def test_lectura_no_puede_asignar(self):
        with patch("modules.shared.services.middleware.AuthService.verify_token", return_value={"sub": "7", "rol": "LECTURA"}):
            self.assertEqual(self.create().status_code, 403)

    def test_listado_ofrece_solo_investigadores_activos(self):
        self.assertEqual({i.id for i in listar_investigadores()}, {1, 2})
        self.assertEqual({i.id for i in listar_investigadores("false")}, {3, 4})

    def test_guardado_repetido_no_duplica_relaciones_ni_historial(self):
        id = self.create().get_json()["id"]
        count = AuditoriaCampo.query.count()
        response = self.update(id, {"investigadores_ids": [1, 2], "coordinador_id": 1})
        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertEqual(InvestigadorProyecto.query.count(), 2)
        self.assertEqual(AuditoriaCampo.query.count(), count)

    def test_fallo_commit_revierte_alta(self):
        with patch("modules.proyectos.services.proyecto_guardado_service.db.session.commit", side_effect=RuntimeError("fallo")):
            response = self.create()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(ProyectoInvestigacion.query.count(), 0)
        self.assertEqual(AuditoriaCampo.query.count(), 0)

    def test_alta_con_fecha_fin_pasada_presente_y_futura(self):
        for fecha_fin in ("2026-02-01", date.today().isoformat(), "2099-12-31"):
            with self.subTest(fecha_fin=fecha_fin):
                response = self.create(fecha_fin=fecha_fin, becarios_ids=[5])
                self.assertEqual(response.status_code, 201, response.get_json())
                id = response.get_json()["id"]
                detail = self.client.get(f"/api/v1/proyectos/{id}", headers=self.headers).get_json()
                self.assertEqual(detail["fecha_fin"], fecha_fin)
                self.assertEqual(next(p["id"] for p in detail["investigadores"] if p["es_coordinador"]), 1)
                self.assertEqual(detail["becarios"][0]["id"], 5)
                expected = fecha_fin if fecha_fin <= date.today().isoformat() else None
                self.assertEqual(detail["investigadores"][0]["fecha_fin"], expected)

    def test_proyecto_previamente_cerrado_no_admite_cambio(self):
        response = self.create(fecha_fin="2026-02-01")
        self.assertEqual(response.status_code, 201, response.get_json())
        self.assertEqual(self.update(response.get_json()["id"], {"coordinador_id": 2}).status_code, 409)

    def test_fecha_fin_anterior_al_inicio_no_deja_alta_parcial(self):
        response = self.create(fecha_fin="2025-12-31")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(ProyectoInvestigacion.query.count(), 0)


if __name__ == "__main__":
    unittest.main()
