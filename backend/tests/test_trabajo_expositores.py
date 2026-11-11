import unittest
from datetime import date, datetime
from io import BytesIO
from unittest.mock import patch

import test_trabajo_autores as fixtures
from extension import db
from modules.grupo.models.grupo import GrupoInvestigacionUtn
from modules.personal.models.personal import Investigador, Becario, Personal
from modules.produccion.models.trabajo_autor import TrabajoReunionAutor
from modules.produccion.models.trabajo_expositor import TrabajoReunionExpositor
from modules.produccion.models.trabajo_reunion import TrabajoReunionCientifica, TrabajoReunionCientificaMemoriaVersion
from modules.produccion.services.trabajo_reunion_service import TrabajoReunionCientificaService as Service
from modules.memorias.models.memorias import Memoria, MemoriaVersion, EstadoMemoria
from modules.memorias.services.memoria_contexto_service import snapshot_contexto_institucional
from modules.memorias.services.exportacion_service_impl import ExportService
from modules.shared.models.auditoria_campo import AuditoriaCampo
from modules.search.services.search_service import SearchService
from sqlalchemy.exc import IntegrityError
from openpyxl import load_workbook


class TrabajoExpositoresTest(unittest.TestCase):
    setUp = fixtures.TrabajoAutoresTest.setUp
    tearDown = fixtures.TrabajoAutoresTest.tearDown

    def payload(self, **changes):
        data = fixtures.TrabajoAutoresTest.payload(self, "reuniones")
        data.pop("expositores")
        return {**data, "expositores": [*self.autores, {"rol": "personal", "id": 1}, {"rol": "externo", "nombre_apellido": "  José   Pérez  "}], **changes}

    def crear(self, **changes):
        respuesta = self.client.post("/reuniones", json=self.payload(**changes), headers=self.headers)
        self.assertEqual(respuesta.status_code, 201, respuesta.get_json())
        return respuesta.get_json()

    def actualizar(self, id, **changes):
        return self.client.put(f"/reuniones/{id}", json=changes, headers=self.headers)

    def test_alta_mixta_filtro_historial_y_edicion_consolidada(self):
        trabajo = self.crear()
        self.assertEqual([a["rol"] for a in trabajo["expositores"]], ["investigador", "becario", "personal", "externo"])
        self.assertEqual(trabajo["expositores"][-1]["nombre_apellido"], "José Pérez")
        self.assertNotIn("autores", trabajo)
        self.assertEqual(TrabajoReunionAutor.query.count(), 0)
        for query in ("expositor_rol=personal&expositor_id=1", "expositor_rol=externo&expositor_nombre=JOSE%20PEREZ"):
            self.assertEqual(len(self.client.get(f"/reuniones?{query}", headers=self.headers).get_json()), 1)
        self.assertEqual(self.client.get("/reuniones?expositor_id=1", headers=self.headers).status_code, 400)
        result = self.actualizar(trabajo["id"], titulo_trabajo="Trabajo actualizado", expositores=[self.autores[0]])
        self.assertEqual(result.status_code, 200, result.get_json())
        self.assertEqual(len(result.get_json()["expositores"]), 1)
        eventos = AuditoriaCampo.query.filter_by(entidad="trabajo_reunion_cientifica", registro_id=trabajo["id"]).all()
        self.assertEqual(len(eventos), 8)  # 4 altas, 3 bajas, título
        self.actualizar(trabajo["id"], expositores=[self.autores[0]])
        self.assertEqual(AuditoriaCampo.query.count(), len(eventos))
        self.assertTrue(any(e.campo == "expositores" for e in eventos))

    def test_obligatorios_invalidos_duplicados_y_otra_uct(self):
        grupo = GrupoInvestigacionUtn(id=2, nombre_sigla_grupo="OTRO", nombre_unidad_academica="Otra", mail="otro@test.local", objetivo_desarrollo="Investigación")
        db.session.add(grupo)
        db.session.flush()
        db.session.add(Investigador(id=4, nombre_apellido="Otra UCT", horas_semanales=20, activo=True, grupo_utn_id=2))
        db.session.commit()
        invalidos = [None, {}, [], [self.autores[0]] * 2, [{"rol": "personal", "id": 99}], [{"rol": "investigador", "id": True}], [{"rol": "investigador", "id": 4}], [{"rol": "investigador", "id": 2}], [{"rol": "desconocido", "id": 1}], [{"rol": "externo", "nombre_apellido": "  "}], [{"rol": "externo", "nombre_apellido": "José Pérez"}, {"rol": "externo", "nombre_apellido": "JOSE  PEREZ"}]]
        trabajo = self.crear()
        for seleccion in invalidos:
            with self.subTest(seleccion=seleccion):
                response = self.client.post("/reuniones", json=self.payload(titulo_trabajo="Alta inválida", expositores=seleccion), headers=self.headers)
                self.assertEqual(response.status_code, 400, response.get_json())
                self.assertIn("expositores", response.get_json()["error"]["details"]["fields"])
                self.assertEqual(self.actualizar(trabajo["id"], titulo_trabajo="No persistir", expositores=seleccion).status_code, 400)
        self.assertEqual(Service.get_by_id(trabajo["id"])["titulo_trabajo"], "Estudio de sistemas")
        self.assertEqual(TrabajoReunionCientifica.query.count(), 1)
        payload = self.payload(titulo_trabajo="Sin selección")
        payload.pop("expositores")
        self.assertEqual(self.client.post("/reuniones", json=payload, headers=self.headers).status_code, 400)

    def test_inactivos_legados_y_cambio_de_grupo(self):
        trabajo = self.crear()
        db.session.get(Becario, 1).soft_delete(7)
        db.session.commit()
        seleccion = [*self.autores, {"rol": "externo", "nombre_apellido": "Externo nuevo"}]
        response = self.actualizar(trabajo["id"], expositores=seleccion)
        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertFalse(response.get_json()["expositores"][1]["activo"])
        self.assertEqual(self.actualizar(trabajo["id"], expositores=[self.autores[0]]).status_code, 200)
        self.assertEqual(self.actualizar(trabajo["id"], expositores=self.autores).status_code, 400)
        legado = TrabajoReunionCientifica(titulo_trabajo="Trabajo legado", nombre_reunion="Congreso", procedencia="Ciudad", fecha_presentacion=date(2026, 3, 1), grupo_utn_id=1, tipo_reunion_id=1, referato=True, alcance="nacional")
        legado.autorias.append(TrabajoReunionAutor(investigador_id=1))
        db.session.add(legado)
        db.session.commit()
        self.assertEqual(self.actualizar(legado.id, titulo_trabajo="Legado editado").status_code, 200)
        self.assertEqual(Service.get_by_id(legado.id)["expositores"], [])
        self.assertEqual(len(legado.autorias), 1)
        self.assertEqual(self.actualizar(legado.id, expositores=[]).status_code, 400)

    def test_permisos_y_rollback(self):
        trabajo = self.crear()
        with patch("modules.shared.services.middleware.AuthService.verify_token", return_value={"sub": "7", "rol": "LECTURA"}):
            self.assertEqual(self.actualizar(trabajo["id"], expositores=[]).status_code, 403)
            self.assertEqual(self.client.post("/reuniones", json=self.payload(), headers=self.headers).status_code, 403)
        with patch("modules.produccion.services.trabajo_expositores_service.AuditoriaService.registrar_evento_relacion", side_effect=RuntimeError("fallo controlado")):
            self.assertEqual(self.actualizar(trabajo["id"], titulo_trabajo="No persistir", expositores=[self.autores[0]]).status_code, 500)
        detalle = Service.get_by_id(trabajo["id"])
        self.assertEqual(detalle["titulo_trabajo"], trabajo["titulo_trabajo"])
        self.assertEqual(len(detalle["expositores"]), 4)
        self.client.delete(f"/reuniones/{trabajo['id']}", headers=self.headers)
        self.assertEqual(self.actualizar(trabajo["id"], expositores=[]).status_code, 409)

    def test_busqueda_internos_externos_sin_autores_legados(self):
        trabajo = self.crear()
        for nombre in ("Eva Profesional", "Jose Perez", "Luis Becario"):
            resultados = [r for r in SearchService.search(nombre) if r["tipo"] == "Trabajo en Reunión Científica"]
            self.assertEqual(len(resultados), 1, nombre)
            self.assertEqual(len(resultados[0]["extra"]["expositores"]), 4)
            self.assertNotIn("autores", resultados[0]["extra"])

    def test_integridad_db(self):
        trabajo = self.crear()
        for campos in ({}, {"personal_id": 1, "investigador_id": 1}, {"personal_id": 99}, {"personal_id": 1}, {"nombre_externo": " ", "nombre_clave": " "}):
            db.session.add(TrabajoReunionExpositor(trabajo_id=trabajo["id"], **campos))
            with self.assertRaises(IntegrityError):
                db.session.commit()
            db.session.rollback()

    def test_snapshots_y_ambas_exportaciones_congelan_expositores(self):
        self.crear()
        self.crear(titulo_trabajo="Trabajo internacional", alcance="internacional")
        grupo_excel = ExportService.generar_excel_grupo(1)
        textos_grupo = [str(c.value) for sheet in load_workbook(grupo_excel) for row in sheet for c in row if c.value is not None]
        self.assertEqual(sum(t == "Expositores" for t in textos_grupo), 2)
        self.assertGreaterEqual(sum("José Pérez" in t for t in textos_grupo), 2)
        memoria = Memoria(grupo_utn_id=1, periodo_inicio=date(2026, 1, 1), periodo_fin=date(2026, 12, 31), created_by=7)
        db.session.add(memoria)
        db.session.flush()
        version = MemoriaVersion(memoria_id=memoria.id, numero_version=1, fecha_apertura=datetime(2026, 1, 1), estado=EstadoMemoria.CERRADA, created_by=7)
        db.session.add(version)
        db.session.flush()
        version.contexto_institucional = snapshot_contexto_institucional(version)
        snapshots = Service.snapshot_para_memoria_version(version, 7)
        db.session.commit()
        db.session.get(Personal, 1).nombre_apellido = "Nombre posterior"
        Service.update(1, {"expositores": [self.autores[0]]}, 7)
        self.assertEqual(len(snapshots[0].serialize()["expositores"]), 4)
        self.assertEqual(snapshots[0].expositores[2]["nombre_apellido"], "Eva Profesional")
        self.assertIn("identidad_id", snapshots[0].expositores[2])
        contenido = ExportService.generar_excel_memoria(memoria.id, version.id)
        textos = [str(c.value) for sheet in load_workbook(contenido) for row in sheet for c in row if c.value is not None]
        self.assertGreaterEqual(sum(t == "Expositores" for t in textos), 2)
        self.assertTrue(any("José Pérez" in t for t in textos))
        self.assertFalse(any("Nombre posterior" in t for t in textos))
        for snapshot in snapshots:
            snapshot.expositores = None
        db.session.commit()
        contenido = ExportService.generar_excel_memoria(memoria.id, version.id)
        textos = [str(c.value) for sheet in load_workbook(contenido) for row in sheet for c in row if c.value is not None]
        self.assertIn("Sin informar", textos)
        self.assertFalse(any("José Pérez" in t for t in textos))
