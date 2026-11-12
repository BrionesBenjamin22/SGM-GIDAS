import importlib.util
import unittest
from datetime import date, datetime
from pathlib import Path
from unittest.mock import patch

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations

from extension import db
from modules.memorias.models.memorias import Memoria, MemoriaVersion, EstadoMemoria
from modules.produccion.models.trabajo_reunion import TrabajoReunionCientifica, TrabajoReunionJornada
from modules.produccion.services.trabajo_reunion_service import TrabajoReunionCientificaService as Service
from modules.produccion.services.trabajo_jornadas import fecha_exportacion, fechas_texto
from modules.memorias.services.exportacion_service_impl import ExportService
from modules.memorias.services.memoria_contexto_service import snapshot_contexto_institucional
from io import BytesIO
from openpyxl import load_workbook
from flask import g
from sqlalchemy import event
from modules.shared.services.tenant_scope import register_tenant_orm_policy
from modules.shared.exceptions import NotFoundError
from modules.search.services.search_service import SearchService
from modules.shared.models.auditoria_campo import AuditoriaCampo
from tests import test_trabajo_autores as fixtures


class JornadasTest(unittest.TestCase):
    setUp = fixtures.TrabajoAutoresTest.setUp
    tearDown = fixtures.TrabajoAutoresTest.tearDown
    payload = fixtures.TrabajoAutoresTest.payload

    def crear(self, fechas=None, **extra):
        payload = self.payload("reuniones")
        payload.pop("fecha_presentacion")
        payload.update(fechas_presentacion=fechas or ["2025-12-31", "2026-01-01", "2026-03-20"], **extra)
        response = self.client.post("/reuniones", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 201, response.get_json())
        return response.get_json()

    def test_normalizacion_diferencias_compatibilidad_y_auditoria(self):
        trabajo = self.crear(["2026-03-22", "2026-03-20", "2026-03-22"])
        self.assertEqual(trabajo["fechas_presentacion"], ["2026-03-20", "2026-03-22"])
        self.assertEqual(trabajo["fecha_presentacion"], "2026-03-20")
        url = f"/reuniones/{trabajo['id']}"
        before = AuditoriaCampo.query.count()
        response = self.client.put(url, json={"fechas_presentacion": ["2026-03-22", "2026-03-20"]}, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(AuditoriaCampo.query.count(), before)
        self.assertEqual(response.get_json()["updated_at"], trabajo["updated_at"])
        for payload in ({"fecha_presentacion": "2026-03-20"}, {"fecha_inicio": "2026-03-21"},
                        {"fechas_presentacion": ["2026-03-20"], "fecha_presentacion": "2026-03-21"}):
            response = self.client.put(url, json=payload, headers=self.headers)
            self.assertEqual(response.status_code, 400, response.get_json())
            self.assertIn("fechas_presentacion", response.get_json()["error"]["details"]["fields"])
        response = self.client.put(url, json={"nombre_reunion": "Congreso actualizado"}, headers=self.headers)
        self.assertEqual(response.get_json()["fechas_presentacion"], trabajo["fechas_presentacion"])
        response = self.client.put(url, json={"fechas_presentacion": ["2027-01-01", "2027-01-02"]}, headers=self.headers)
        self.assertEqual(response.status_code, 200, response.get_json())
        cambio = AuditoriaCampo.query.filter_by(campo="fechas_presentacion").one()
        self.assertEqual(cambio.valor_anterior, ["2026-03-20", "2026-03-22"])
        self.assertEqual(cambio.valor_nuevo, ["2027-01-01", "2027-01-02"])
        self.assertEqual(TrabajoReunionJornada.query.count(), 2)

    def test_validacion_representaciones_y_fechas_futuras(self):
        for fechas in ([], None, "2026-01-01", [None], ["2026-2-01"], ["2026-02-30"], ["2009-12-31"], ["20260101"], ["2026-W01-1"]):
            payload = self.payload("reuniones")
            payload.pop("fecha_presentacion")
            payload["fechas_presentacion"] = fechas
            response = self.client.post("/reuniones", json=payload, headers=self.headers)
            self.assertEqual(response.status_code, 400, (fechas, response.get_json()))
        trabajo = self.crear(["2099-01-01", "2099-01-02"], fecha_presentacion="2099-01-01", fecha_inicio="2099-01-01")
        self.assertEqual(trabajo["fecha_presentacion"], "2099-01-01")

    def test_duplicados_comparan_todo_el_conjunto(self):
        self.crear(["2026-03-20", "2026-03-22"])
        otro = self.crear(["2026-03-20", "2026-03-21"])
        response = self.client.put(f"/reuniones/{otro['id']}", json={"fechas_presentacion": ["2026-03-22", "2026-03-20"]}, headers=self.headers)
        self.assertEqual(response.status_code, 409)
        self.assertEqual(TrabajoReunionJornada.query.count(), 4)

    def test_jornadas_cargan_en_bloque_y_respetan_uct(self):
        for index in range(9):
            self.crear(titulo_trabajo=f"Trabajo para carga agrupada {index}")
        db.session.remove()
        queries = []
        def capture(connection, cursor, statement, params, context, many):
            if statement.lstrip().upper().startswith("SELECT") and "FROM trabajo_reunion_jornada" in statement:
                queries.append(statement)
        event.listen(db.engine, "before_cursor_execute", capture)
        try:
            rows = Service.get_all()
            self.assertEqual(len(rows), 9)
            self.assertEqual(len(queries), 1)
            self.assertTrue(all(len(row["fechas_presentacion"]) == 3 for row in rows))
        finally:
            event.remove(db.engine, "before_cursor_execute", capture)
        register_tenant_orm_policy()
        db.session.remove()
        with self.app.test_request_context("/"):
            g.current_grupo_utn_id = 2
            self.assertEqual(Service.get_all(), [])
            self.assertEqual(TrabajoReunionJornada.query.all(), [])
            with self.assertRaises(NotFoundError):
                Service.get_by_id(rows[0]["id"])
        db.session.remove()

    def test_lectura_no_puede_reemplazar_jornadas(self):
        trabajo = self.crear()
        with patch("modules.shared.services.middleware.AuthService.verify_token", return_value={"sub": "7", "rol": "LECTURA"}):
            response = self.client.put(f"/reuniones/{trabajo['id']}", json={"fechas_presentacion": ["2027-01-01"]}, headers=self.headers)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Service.get_by_id(trabajo["id"])["fechas_presentacion"], trabajo["fechas_presentacion"])

    def test_busqueda_conserva_primera_fecha_y_expone_conjunto(self):
        trabajo = self.crear()
        resultados = [r for r in SearchService.search("Estudio de sistemas") if r["tipo"] == "Trabajo en Reunión Científica"]
        self.assertEqual(len(resultados), 1)
        self.assertEqual(resultados[0]["fecha"], date(2025, 12, 31))
        self.assertEqual(resultados[0]["extra"]["fechas_presentacion"], trabajo["fechas_presentacion"])

    def test_rollback_de_jornadas_primera_fecha_y_auditoria(self):
        trabajo = self.crear()
        before = AuditoriaCampo.query.count()
        with patch("extension.db.session.commit", side_effect=RuntimeError("fallo controlado")):
            with self.assertRaises(RuntimeError):
                Service.update(trabajo["id"], {"fechas_presentacion": ["2027-03-01"]}, 7)
        db.session.expire_all()
        actual = Service.get_by_id(trabajo["id"])
        self.assertEqual(actual["fechas_presentacion"], trabajo["fechas_presentacion"])
        self.assertEqual(actual["fecha_presentacion"], trabajo["fecha_presentacion"])
        self.assertEqual(AuditoriaCampo.query.count(), before)

    def version(self, inicio, fin):
        memoria = Memoria(grupo_utn_id=1, periodo_inicio=inicio, periodo_fin=fin, created_by=7)
        db.session.add(memoria)
        db.session.flush()
        version = MemoriaVersion(memoria_id=memoria.id, numero_version=1, fecha_apertura=datetime(2026, 1, 1), estado=EstadoMemoria.CERRADA, created_by=7)
        db.session.add(version)
        db.session.flush()
        return version

    def test_memorias_cruce_huecos_una_aparicion_y_foto_inmutable(self):
        trabajo = self.crear()
        for anio in (2025, 2026):
            version = self.version(date(anio, 1, 1), date(anio, 12, 31))
            snapshots = Service.snapshot_para_memoria_version(version, 7)
            db.session.commit()
            self.assertEqual(len(snapshots), 1)
            self.assertEqual(snapshots[0].fechas_presentacion, trabajo["fechas_presentacion"])
        hueco = self.version(date(2026, 2, 1), date(2026, 2, 28))
        self.assertEqual(Service.snapshot_para_memoria_version(hueco, 7), [])
        Service.update(trabajo["id"], {"fechas_presentacion": ["2028-01-01"]}, 7)
        self.assertEqual(snapshots[0].fechas_presentacion, trabajo["fechas_presentacion"])

    def test_baja_logica_se_evalua_por_jornada_y_conserva_relacion(self):
        trabajo = self.crear()
        entity = db.session.get(TrabajoReunionCientifica, trabajo["id"])
        entity.deleted_at = datetime(2026, 1, 2)
        entity.activo = False
        db.session.commit()
        enero = self.version(date(2026, 1, 1), date(2026, 1, 31))
        self.assertEqual(len(Service.snapshot_para_memoria_version(enero, 7)), 1)
        marzo = self.version(date(2026, 3, 1), date(2026, 3, 31))
        self.assertEqual(Service.snapshot_para_memoria_version(marzo, 7), [])
        self.assertEqual(len(entity.jornadas), 3)
        self.assertEqual(Service.restore(entity.id)["fechas_presentacion"], trabajo["fechas_presentacion"])

    def test_exportacion_fecha_nativa_y_rangos_sin_huecos(self):
        fechas = ["2026-03-20", "2026-03-21", "2026-03-23"]
        self.assertEqual(fechas_texto(fechas), "20/03/2026 – 21/03/2026; 23/03/2026")
        self.assertEqual(fecha_exportacion({"fechas_presentacion": fechas}), fechas_texto(fechas))
        self.assertEqual(fecha_exportacion({"fecha_presentacion": fechas[0]}), date(2026, 3, 20))

    def test_excel_grupo_memoria_y_detalle_usan_jornadas_completas(self):
        fechas = ["2026-03-20", "2026-03-21", "2026-03-23"]
        self.crear(fechas)
        texto = fechas_texto(fechas)
        grupo = load_workbook(ExportService.generar_excel_grupo(1))
        self.assertIn(texto, [c.value for sheet in grupo for row in sheet for c in row])
        version = self.version(date(2026, 1, 1), date(2026, 12, 31))
        version.contexto_institucional = snapshot_contexto_institucional(version)
        snapshots = Service.snapshot_para_memoria_version(version, 7)
        db.session.commit()
        sources = {key: [] for key in ("investigadores", "becarios", "personal", "proyectos", "participaciones", "visitas", "articulos", "documentacion", "registros", "distinciones", "transferencias", "actividades", "erogaciones", "equipamiento", "becas", "planificaciones", "trabajos_revista")}
        sources.update(memoria=version.memoria, version=version, trabajos_reunion=[s.serialize() for s in snapshots])
        with patch.object(ExportService, "_build_memoria_snapshot_sources", return_value=sources):
            excel = load_workbook(BytesIO(ExportService.generar_excel_memoria(version.memoria_id, version.id).getvalue()))
        for name in ("Detalle académico", "Formulario"):
            sheet = excel[name] if name in excel.sheetnames else excel.worksheets[0]
            self.assertIn(texto, [c.value for row in sheet for c in row])


class MigracionJornadasTest(unittest.TestCase):
    def test_backfill_usa_fecha_propia_del_snapshot_y_downgrade(self):
        path = Path(__file__).resolve().parents[1] / "migrations/versions/c7a9e1f3b5d8_reunion_jornadas.py"
        spec = importlib.util.spec_from_file_location("jornadas_migration", path)
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)
        engine = sa.create_engine("sqlite:///:memory:")
        with engine.begin() as connection:
            connection.execute(sa.text("CREATE TABLE trabajo_reunion_cientifica (id INTEGER PRIMARY KEY, fecha_presentacion DATE NOT NULL)"))
            connection.execute(sa.text("CREATE TABLE trabajo_reunion_cientifica_memoria_version (id INTEGER PRIMARY KEY, fecha_presentacion DATE NOT NULL)"))
            connection.execute(sa.text("INSERT INTO trabajo_reunion_cientifica VALUES (1, '2026-03-20')"))
            connection.execute(sa.text("INSERT INTO trabajo_reunion_cientifica_memoria_version VALUES (1, '2025-02-10')"))
            operations = Operations(MigrationContext.configure(connection))
            with patch.object(migration, "op", operations):
                migration.upgrade()
                self.assertEqual(connection.execute(sa.text("SELECT fecha FROM trabajo_reunion_jornada")).scalar(), "2026-03-20")
                self.assertEqual(connection.execute(sa.text("SELECT fechas_presentacion FROM trabajo_reunion_cientifica_memoria_version")).scalar(), '["2025-02-10"]')
                migration.downgrade()
                self.assertNotIn("trabajo_reunion_jornada", sa.inspect(connection).get_table_names())
        engine.dispose()
