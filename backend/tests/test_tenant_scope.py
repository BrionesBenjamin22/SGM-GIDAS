import unittest
from datetime import date, datetime
from unittest.mock import patch

from flask import Flask, g
from sqlalchemy import event

from extension import db
from modules import models_registry  # noqa: F401
from modules.auth.models.usuario import RolUsuario, Usuario
from modules.auth.models.usuario_grupo_utn import UsuarioGrupoUtn
from modules.auth.services.auth_service import AuthService
from modules.dashboard.services.dashboard_service import DashboardService
from modules.catalogos.models.fuente_financiamiento import FuenteFinanciamiento
from modules.grupo.models.grupo import GrupoInvestigacionUtn
from modules.grupo.services.grupo_service import actualizar_grupo_utn, obtener_historial_grupo_utn
from modules.memorias.models.memorias import EstadoMemoria, Memoria, MemoriaVersion
from modules.memorias.routes.memorias_rutas import memoria_bp
from modules.memorias.services.exportacion_service_impl import ExportService
from modules.memorias.services.memoria_periodo_service import consultar_entidades_memoria
from modules.memorias.services.memoria_service import MemoriaService
from modules.personal.models.personal import Investigador, InvestigadorMemoriaVersion
from modules.personal.models.personal import Becario, TipoFormacion
from modules.recursos.models.becas import Beca, Beca_Becario
from modules.recursos.services.becas_service import BecaService
from modules.recursos.models.movimiento_financiero import MovimientoFinanciero
from modules.recursos.services.saldo_financiero_service import SaldoFinancieroService
from modules.search.services.search_service import SearchService
from modules.shared.exceptions import ForbiddenError, ValidationError
from modules.shared.exceptions import NotFoundError
from modules.shared.models.auditoria_campo import AuditoriaCampo
from modules.shared.services.auditoria_service import AuditoriaService
from modules.shared.services.tenant_scope import register_tenant_orm_policy
from modules.shared.services.tenant_request import register_tenant_request_scope
from modules.transferencia.models.transferencia_socio import Adoptante
from modules.transferencia.services.adoptante_service import AdoptanteService


class TenantScopeTest(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI="sqlite:///:memory:")
        db.init_app(self.app)
        self.app.register_blueprint(memoria_bp, url_prefix="/api/v1/memorias")
        register_tenant_request_scope(self.app)
        register_tenant_orm_policy()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        roles = [RolUsuario(id=1, nombre="ADMIN"), RolUsuario(id=2, nombre="GESTOR"),
                 RolUsuario(id=3, nombre="LECTURA")]
        users = [Usuario(id=user_id, nombre_usuario=name, mail=f"{name}@example.test",
                         id_rol=role_id, contrasena="unused", primer_login=False)
                 for user_id, name, role_id in ((1, "admin", 1), (2, "gestor", 2),
                                                (3, "lectura", 3), (4, "sinuct", 3))]
        groups = [GrupoInvestigacionUtn(id=group_id, nombre_sigla_grupo=f"UCT {group_id}",
                    nombre_unidad_academica="Regional", objetivo_desarrollo="Investigacion",
                    mail=f"uct{group_id}@example.test") for group_id in (1, 2)]
        db.session.add_all([*roles, *users, *groups])
        db.session.flush()
        db.session.add_all([
            UsuarioGrupoUtn(usuario_id=1, grupo_utn_id=1, created_by=1),
            UsuarioGrupoUtn(usuario_id=2, grupo_utn_id=1, created_by=1),
            UsuarioGrupoUtn(usuario_id=3, grupo_utn_id=2, created_by=1),
        ])
        db.session.add_all([
            Memoria(id=group_id, grupo_utn_id=group_id,
                    periodo_inicio=date(2025, 1, 1), periodo_fin=date(2025, 12, 31))
            for group_id in (1, 2)
        ])
        db.session.commit()
        db.session.remove()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_listas_y_detalles_no_resuelven_otra_uct(self):
        with self.app.test_request_context("/api/v1/memorias"):
            g.current_grupo_utn_id = 1
            self.assertEqual([item.id for item in Memoria.query.all()], [1])
            self.assertEqual(Memoria.query.count(), 1)
            self.assertIsNone(db.session.get(Memoria, 2))
            self.assertEqual([item.id for item in GrupoInvestigacionUtn.query.all()], [1])

    def test_filtros_cacheados_respetan_cambio_de_uct_entre_solicitudes(self):
        for group_id in (1, 2, 1):
            db.session.remove()
            with self.app.test_request_context("/api/v1/grupo/grupo-utn"):
                g.current_grupo_utn_id = group_id
                self.assertEqual(
                    [item.id for item in GrupoInvestigacionUtn.query.all()],
                    [group_id],
                )
                self.assertEqual(
                    [item.id for item in Memoria.query.all()],
                    [group_id],
                )

    def test_historial_grupo_registra_diferencias_y_aisla_uct(self):
        db.session.add(AuditoriaCampo(
            entidad="grupo_utn", registro_id=2, campo="mail",
            valor_anterior="anterior@example.test",
            valor_nuevo="privado@example.test", usuario_id=3,
        ))
        db.session.commit()
        db.session.remove()

        with self.app.test_request_context("/api/v1/grupo/grupo-utn/1/historial"):
            g.current_grupo_utn_id = 1
            self.assertEqual(obtener_historial_grupo_utn(1), [])
            grupo = actualizar_grupo_utn({
                "mail": " nuevo@example.test ",
                "nombre_sigla_grupo": "UCT 1 modificada",
            }, user_id=2)
            self.assertEqual(grupo.updated_by, 2)
            self.assertEqual(grupo.mail, "nuevo@example.test")
            updated_at = grupo.updated_at

            actualizar_grupo_utn({"mail": " nuevo@example.test "}, user_id=2)
            self.assertEqual(grupo.updated_at, updated_at)
            historial = obtener_historial_grupo_utn(1)
            self.assertEqual(len(historial), 2)
            self.assertEqual({item["campo"] for item in historial}, {"mail", "nombre_sigla_grupo"})
            self.assertTrue(all(item["usuario_nombre"] == "gestor" for item in historial))
            self.assertEqual(historial[0]["valor_anterior"], "UCT 1")
            self.assertEqual(historial[0]["valor_nuevo"], "UCT 1 modificada")
            self.assertEqual(historial[1]["valor_anterior"], "uct1@example.test")
            self.assertEqual(historial[1]["valor_nuevo"], "nuevo@example.test")
            with self.assertRaises(NotFoundError):
                obtener_historial_grupo_utn(2)

        db.session.remove()
        with self.app.test_request_context("/api/v1/grupo/grupo-utn/2/historial"):
            g.current_grupo_utn_id = 2
            historial = obtener_historial_grupo_utn(2)
            self.assertEqual(len(historial), 1)
            self.assertEqual(historial[0]["valor_nuevo"], "privado@example.test")

    def test_historial_adoptante_registra_solo_campos_y_aisla_uct(self):
        db.session.add_all([
            Adoptante(id=101, grupo_utn_id=1, nombre="Empresa Uno"),
            Adoptante(id=102, grupo_utn_id=2, nombre="Empresa Dos"),
        ])
        db.session.add(AuditoriaCampo(
            entidad="transferencia_socio_productiva", registro_id=9,
            campo="adoptantes", valor_nuevo={"accion": "vincular", "detalle": {"adoptante_id": 101}},
            usuario_id=2,
        ))
        db.session.commit()
        db.session.remove()

        with self.app.test_request_context("/api/v1/transferencia/adoptantes/101/historial"):
            g.current_grupo_utn_id = 1
            AdoptanteService.update(101, {"nombre": "Empresa Nueva"}, 2)
            actualizado = db.session.get(Adoptante, 101)
            updated_at = actualizado.updated_at
            AdoptanteService.update(101, {"nombre": " Empresa Nueva "}, 2)
            historial = AdoptanteService.get_historial(101)
            self.assertEqual(len(historial), 1)
            self.assertEqual(historial[0]["campo"], "nombre")
            self.assertEqual(historial[0]["valor_anterior"], "Empresa Uno")
            self.assertEqual(historial[0]["valor_nuevo"], "Empresa Nueva")
            self.assertEqual(historial[0]["usuario_nombre"], "gestor")
            self.assertEqual(actualizado.updated_at, updated_at)
            with self.assertRaises(NotFoundError):
                AdoptanteService.get_historial(102)

        db.session.remove()
        with self.app.test_request_context("/api/v1/transferencia/adoptantes/102/historial"):
            g.current_grupo_utn_id = 2
            self.assertEqual(AdoptanteService.get_historial(102), [])
            with self.assertRaises(NotFoundError):
                AdoptanteService.get_historial(101)

    def test_conteo_de_memoria_cerrada_respeta_uct_y_borrado_logico(self):
        version = MemoriaVersion(
            memoria_id=1, numero_version=1, fecha_apertura=datetime.utcnow(),
            estado=EstadoMemoria.CERRADA,
        )
        db.session.add(version)
        db.session.flush()
        version_id = version.id
        db.session.get(Memoria, 1).version_actual_id = version_id
        db.session.commit()

        table = db.metadata.tables["movimiento_memoria_version"]
        base = {
            "memoria_version_id": version_id, "fecha": date(2025, 1, 1),
            "tipo_movimiento": "INGRESO", "monto": 10, "moneda": "ARS",
            "deleted_at": None,
        }
        db.session.execute(table.insert(), [
            {**base, "movimiento_id": 1, "numero_movimiento": 1, "grupo_utn_id": 1},
            {**base, "movimiento_id": 2, "numero_movimiento": 2, "grupo_utn_id": 1,
             "deleted_at": datetime.utcnow()},
            {**base, "movimiento_id": 3, "numero_movimiento": 3, "grupo_utn_id": 2},
        ])
        db.session.commit()
        db.session.remove()

        with self.app.test_request_context("/api/v1/memorias"):
            g.current_grupo_utn_id = 1
            scoped_version = db.session.get(MemoriaVersion, version_id)
            self.assertEqual(MemoriaService._contar_elementos_version(scoped_version), 1)

    def test_rechaza_escritura_de_otra_uct(self):
        with self.app.test_request_context("/api/v1/memorias"):
            g.current_grupo_utn_id = 1
            db.session.add(Memoria(grupo_utn_id=2, periodo_inicio=date(2026, 1, 1),
                                   periodo_fin=date(2026, 12, 31)))
            with self.assertRaises(ForbiddenError):
                db.session.flush()
            db.session.rollback()

    def test_alta_sin_grupo_hereda_uct_validada(self):
        with self.app.test_request_context("/api/v1/recursos/becas"):
            g.current_grupo_utn_id = 1
            beca = Beca(nombre_beca="Nueva beca")
            db.session.add(beca)
            db.session.flush()
            self.assertEqual(beca.grupo_utn_id, 1)
            db.session.rollback()

    def test_becas_activas_por_anio_respetan_periodo_y_uct(self):
        db.session.add(TipoFormacion(id=1, nombre="Doctorado"))
        db.session.add_all([
            Beca(id=1, nombre_beca="Vigente", grupo_utn_id=1),
            Beca(id=2, nombre_beca="Finalizada", grupo_utn_id=1),
            Beca(id=3, nombre_beca="Otra UCT", grupo_utn_id=2),
            Becario(id=1, nombre_apellido="Becario A", horas_semanales=10,
                    grupo_utn_id=1, tipo_formacion_id=1),
            Becario(id=2, nombre_apellido="Becario B", horas_semanales=10,
                    grupo_utn_id=2, tipo_formacion_id=1),
        ])
        db.session.flush()
        db.session.add_all([
            Beca_Becario(id_beca=1, id_becario=1, fecha_inicio=date(2025, 1, 1)),
            Beca_Becario(id_beca=2, id_becario=1, fecha_inicio=date(2023, 1, 1),
                         fecha_fin=date(2024, 12, 31)),
            Beca_Becario(id_beca=3, id_becario=2, fecha_inicio=date(2025, 1, 1)),
        ])
        db.session.commit()
        db.session.remove()

        with self.app.test_request_context("/api/v1/recursos/becas/activas?anio=2025"):
            g.current_grupo_utn_id = 1
            self.assertEqual(
                [beca["id"] for beca in BecaService.get_becas_activas_en_anio(2025)],
                [1],
            )

    def test_alta_de_usuario_hereda_uct_del_administrador(self):
        with self.app.test_request_context("/api/v1/auth/usuarios"):
            g.current_grupo_utn_id = 1
            nuevo = AuthService.register(
                nombre_usuario="nuevo", mail="nuevo@example.test",
                password="ClaveSegura123", rol_id=3,
                nombre_apellido="Usuario Nuevo", dni="12345678",
                es_primer_usuario=False, actor_id=1,
            )
            self.assertEqual([group.grupo_utn_id for group in nuevo.grupos_utn], [1])

    def test_todos_los_modelos_mapeados_admiten_filtro_de_uct(self):
        with self.app.test_request_context("/api/v1/search"):
            g.current_grupo_utn_id = 1
            for mapper in db.Model.registry.mappers:
                with self.subTest(model=mapper.class_.__name__):
                    mapper.class_.query.limit(1).all()

    def test_relacion_entre_uct_distintas_es_rechazada(self):
        db.session.add_all([
            Beca(id=1, nombre_beca="Beca", grupo_utn_id=1),
            TipoFormacion(id=1, nombre="Doctorado"),
            Becario(id=2, nombre_apellido="Becario B", horas_semanales=10,
                    grupo_utn_id=2, tipo_formacion_id=1),
        ])
        db.session.commit()
        with self.app.test_request_context("/api/v1/recursos/becas"):
            g.current_grupo_utn_id = 1
            db.session.add(Beca_Becario(id_beca=1, id_becario=2,
                                        fecha_inicio=date(2025, 1, 1)))
            with self.assertRaises(ForbiddenError):
                db.session.flush()
            db.session.rollback()

    def _crear_becarios_para_relaciones(self, cantidad):
        db.session.add(TipoFormacion(id=1, nombre="Doctorado"))
        db.session.add(Beca(id=1, nombre_beca="Beca institucional", grupo_utn_id=1))
        db.session.add_all([
            Becario(id=i, nombre_apellido=f"Integrante {i}", horas_semanales=10,
                    grupo_utn_id=1, tipo_formacion_id=1)
            for i in range(1, cantidad + 1)
        ])
        db.session.commit()

    def test_valida_mas_de_500_relaciones_con_consultas_acotadas(self):
        self._crear_becarios_para_relaciones(501)
        with self.app.test_request_context("/api/v1/recursos/becas"):
            g.current_grupo_utn_id = 1
            db.session.add_all([
                Beca_Becario(id_beca=1, id_becario=i, fecha_inicio=date(2025, 1, 1))
                for i in range(1, 502)
            ])
            selects = []
            def contar(conn, cursor, statement, parameters, context, executemany):
                if statement.lstrip().upper().startswith("SELECT"):
                    selects.append(statement)
            event.listen(db.engine, "before_cursor_execute", contar)
            try:
                db.session.flush()
            finally:
                event.remove(db.engine, "before_cursor_execute", contar)
            self.assertLessEqual(len(selects), 3)
            self.assertEqual(Beca_Becario.query.count(), 501)
            db.session.rollback()

    def test_un_origen_ajeno_rechaza_el_lote_completo(self):
        self._crear_becarios_para_relaciones(2)
        db.session.add(Becario(id=3, nombre_apellido="Integrante ajeno", horas_semanales=10,
                              grupo_utn_id=2, tipo_formacion_id=1))
        db.session.commit()
        with self.app.test_request_context("/api/v1/recursos/becas"):
            g.current_grupo_utn_id = 1
            db.session.add_all([
                Beca_Becario(id_beca=1, id_becario=i, fecha_inicio=date(2025, 1, 1))
                for i in (1, 2, 3)
            ])
            with self.assertRaises(ForbiddenError):
                db.session.flush()
            db.session.rollback()
        self.assertEqual(Beca_Becario.query.count(), 0)

    def test_revalida_el_mismo_origen_tras_cambiar_su_uct_entre_flushes(self):
        self._crear_becarios_para_relaciones(2)
        with self.app.test_request_context("/api/v1/recursos/becas"):
            g.current_grupo_utn_id = 1
            db.session.add(Beca_Becario(id_beca=1, id_becario=1,
                                        fecha_inicio=date(2025, 1, 1)))
            db.session.flush()
            # Simulate an ownership change already visible to this transaction.
            db.session.execute(Beca.__table__.update().where(Beca.id == 1).values(grupo_utn_id=2))
            db.session.add(Beca_Becario(id_beca=1, id_becario=2,
                                        fecha_inicio=date(2025, 1, 1)))
            with self.assertRaises(ForbiddenError):
                db.session.flush()
            db.session.rollback()

    def test_relacion_existente_no_serializa_becario_de_otra_uct(self):
        db.session.add_all([
            Beca(id=1, nombre_beca="Beca", grupo_utn_id=1),
            Beca(id=2, nombre_beca="Beca de otra UCT", grupo_utn_id=2),
            TipoFormacion(id=1, nombre="Doctorado"),
            Becario(id=1, nombre_apellido="Becario A", horas_semanales=10,
                    grupo_utn_id=1, tipo_formacion_id=1),
            Becario(id=2, nombre_apellido="Becario B", horas_semanales=10,
                    grupo_utn_id=2, tipo_formacion_id=1),
        ])
        db.session.flush()
        db.session.add_all([
            Beca_Becario(id_beca=1, id_becario=1, fecha_inicio=date(2025, 1, 1)),
            Beca_Becario(id_beca=1, id_becario=2, fecha_inicio=date(2025, 1, 1)),
            Beca_Becario(id_beca=2, id_becario=2, fecha_inicio=date(2025, 1, 1)),
        ])
        db.session.commit()
        db.session.remove()
        with self.app.test_request_context("/api/v1/recursos/becas"):
            g.current_grupo_utn_id = 1
            beca = Beca.query.first()
            self.assertIsNotNone(beca)
            self.assertEqual(Beca.query.count(), 1)
            self.assertEqual([item["nombre_apellido"] for item in beca.serialize()["becarios"]],
                             ["Becario A"])

    def test_snapshot_sin_memoria_asociada_falla_cerrado(self):
        version = MemoriaVersion(numero_version=1, fecha_apertura=datetime.utcnow(), memoria_id=999)
        with self.assertRaises(ValidationError):
            consultar_entidades_memoria(Investigador, version)

    def test_snapshot_filtra_origen_y_version_por_uct(self):
        db.session.add_all([
            Investigador(id=1, nombre_apellido="Investigador A", horas_semanales=10,
                          grupo_utn_id=1),
            Investigador(id=2, nombre_apellido="Investigador B", horas_semanales=10,
                          grupo_utn_id=2),
            MemoriaVersion(id=1, memoria_id=1, numero_version=1,
                           fecha_apertura=datetime.utcnow()),
        ])
        db.session.flush()
        db.session.add_all([
            InvestigadorMemoriaVersion(memoria_version_id=1, investigador_id=1,
                nombre_apellido="Investigador A", grupo_utn_id=1),
            InvestigadorMemoriaVersion(memoria_version_id=1, investigador_id=2,
                nombre_apellido="Investigador B con grupo falso", grupo_utn_id=1),
        ])
        db.session.commit()
        db.session.remove()
        version = db.session.get(MemoriaVersion, 1)
        self.assertEqual([person.id for person in consultar_entidades_memoria(Investigador, version)], [1])
        with self.app.test_request_context("/api/v1/memorias/1/versiones/1"):
            g.current_grupo_utn_id = 1
            self.assertEqual([item.investigador_id for item in InvestigadorMemoriaVersion.query.all()], [1])

    def test_historial_de_memoria_ajena_no_se_entrega(self):
        db.session.add(AuditoriaCampo(entidad="memoria", registro_id=2, campo="periodo_fin",
                                      valor_anterior="2024-12-31", valor_nuevo="2025-12-31"))
        db.session.commit()
        with self.app.test_request_context("/api/v1/memorias/2/historial"):
            g.current_grupo_utn_id = 1
            with self.assertRaises(NotFoundError):
                AuditoriaService.obtener_historial_entidad("memoria", 2)

    def test_contexto_institucional_ajeno_no_se_serializa(self):
        version = MemoriaVersion(memoria_id=1, numero_version=1,
                                fecha_apertura=datetime.utcnow(),
                                contexto_institucional={"grupo": {"id": 2, "nombre_sigla_grupo": "UCT 2"}})
        db.session.add(version)
        db.session.commit()
        self.assertIsNone(version.serialize()["contexto_institucional"])

    def test_busqueda_no_retorna_personal_de_otra_uct(self):
        db.session.add_all([
            Investigador(nombre_apellido="Investigador Alfa", horas_semanales=10, grupo_utn_id=1),
            Investigador(nombre_apellido="Investigador Beta", horas_semanales=10, grupo_utn_id=2),
        ])
        db.session.commit()
        db.session.remove()
        with self.app.test_request_context("/api/v1/search/"):
            g.current_grupo_utn_id = 1
            result = SearchService.search("Investigador Beta", "alf_asc", "false", 100)
            self.assertEqual(result, [])

    def test_exportacion_no_resuelve_uct_ajena(self):
        with self.app.test_request_context("/api/v1/grupo/grupo-utn/exportar-excel"):
            g.current_grupo_utn_id = 1
            with self.assertRaises(NotFoundError):
                ExportService._get_grupo(2)

    def test_dashboard_solo_agrega_el_grupo_cargado(self):
        with self.app.test_request_context("/api/v1/dashboards/resumen"):
            g.current_grupo_utn_id = 1
            resumen = DashboardService.get_resumen()
            self.assertEqual([item["grupo_id"] for item in
                              resumen["distribuciones"]["integrantes_por_grupo"]], [1])

    def test_saldo_agregado_no_incluye_movimientos_de_otra_uct(self):
        db.session.add(FuenteFinanciamiento(id=1, nombre="Fuente"))
        db.session.flush()
        db.session.add_all([
            MovimientoFinanciero(grupo_utn_id=1, numero_movimiento=1,
                fecha=date(2025, 1, 1), tipo_movimiento="INGRESO", monto="100",
                moneda="ARS", fuente_financiamiento_id=1),
            MovimientoFinanciero(grupo_utn_id=2, numero_movimiento=1,
                fecha=date(2025, 1, 1), tipo_movimiento="INGRESO", monto="900",
                moneda="ARS", fuente_financiamiento_id=1),
        ])
        db.session.commit()
        db.session.remove()
        with self.app.test_request_context("/api/v1/dashboards/resumen"):
            g.current_grupo_utn_id = 1
            self.assertEqual(SaldoFinancieroService.calcular(None).total_ingresos, 100)
            with self.assertRaises(NotFoundError):
                SaldoFinancieroService.saldo_de_fuente(2, 1)

    def test_http_memorias_aisla_listas_detalles_y_alta(self):
        db.session.add(MemoriaVersion(id=2, memoria_id=2, numero_version=1,
                                      fecha_apertura=datetime.utcnow()))
        db.session.commit()
        client = self.app.test_client()
        headers = {"Authorization": "Bearer token"}
        with patch("modules.shared.services.tenant_request.AuthService.verify_token",
                   return_value={"sub": "1", "rol": "ADMIN"}):
            listing = client.get("/api/v1/memorias", headers=headers)
            self.assertEqual(listing.status_code, 200)
            self.assertEqual([item["id"] for item in listing.get_json()], [1])
            self.assertEqual(client.get("/api/v1/memorias/2", headers=headers).status_code, 404)
            self.assertEqual(client.get(
                "/api/v1/memorias/2/versiones/2/investigadores", headers=headers,
            ).status_code, 404)
            created = client.post("/api/v1/memorias", headers=headers, json={
                "grupo_utn_id": 2,
                "periodo_inicio": "2026-01-01",
                "periodo_fin": "2026-12-31",
            })
            self.assertEqual(created.status_code, 400)

    def test_http_gestor_lectura_y_usuario_sin_uct(self):
        client = self.app.test_client()
        headers = {"Authorization": "Bearer token"}
        for user_id, expected_memoria in ((2, 1), (3, 2)):
            with self.subTest(user_id=user_id), patch(
                "modules.shared.services.tenant_request.AuthService.verify_token",
                return_value={"sub": str(user_id), "rol": "ADMIN"},
            ):
                response = client.get("/api/v1/memorias", headers=headers)
                self.assertEqual(response.status_code, 200)
                self.assertEqual([item["id"] for item in response.get_json()], [expected_memoria])
                if user_id == 3:
                    self.assertEqual(client.post("/api/v1/memorias", headers=headers,
                        json={"grupo_utn_id": 2, "periodo_inicio": "2026-01-01",
                              "periodo_fin": "2026-12-31"}).status_code, 403)
        with patch("modules.shared.services.tenant_request.AuthService.verify_token",
                   return_value={"sub": "4", "rol": "LECTURA"}):
            self.assertEqual(client.get("/api/v1/memorias", headers=headers).status_code, 403)


if __name__ == "__main__":
    unittest.main()
