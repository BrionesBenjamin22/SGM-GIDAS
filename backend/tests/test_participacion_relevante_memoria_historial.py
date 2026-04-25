import unittest
from datetime import date, datetime
from types import SimpleNamespace
from unittest.mock import patch

from core.models.auditoria_campo import AuditoriaCampo
from core.models.memorias import EstadoMemoria, Memoria, MemoriaVersion
from core.services.memoria_service import MemoriaService
from core.services.participacion_relevante_service import (
    ParticipacionRelevanteService,
)


class ParticipacionRelevanteMemoriaHistorialTestCase(unittest.TestCase):

    def setUp(self):
        self.add_patcher = patch("extension.db.session.add")
        self.commit_patcher = patch("extension.db.session.commit")
        self.rollback_patcher = patch("extension.db.session.rollback")
        self.get_patcher = patch("core.services.memoria_service.db.session.get")

        self.mock_add = self.add_patcher.start()
        self.mock_commit = self.commit_patcher.start()
        self.mock_rollback = self.rollback_patcher.start()
        self.mock_get = self.get_patcher.start()

        self.addCleanup(self.add_patcher.stop)
        self.addCleanup(self.commit_patcher.stop)
        self.addCleanup(self.rollback_patcher.stop)
        self.addCleanup(self.get_patcher.stop)

    def test_snapshot_participacion_relevante_para_memoria_version_persiste_foto(self):
        version = MemoriaVersion(
            id=25,
            numero_version=1,
            fecha_apertura=datetime(2026, 1, 1, 0, 0, 0),
            estado=EstadoMemoria.CERRADA,
            created_by=1
        )
        participacion = SimpleNamespace(
            id=7,
            nombre_evento="Congreso A",
            forma_participacion="panelista",
            fecha=date(2026, 4, 20),
            investigador_id=4,
            investigador=SimpleNamespace(nombre_apellido="Ana Perez")
        )

        fake_query = SimpleNamespace(
            filter=lambda *args, **kwargs: SimpleNamespace(all=lambda: [participacion])
        )

        with patch(
            "core.services.participacion_relevante_service.ParticipacionRelevante",
            new=SimpleNamespace(
                query=fake_query,
                deleted_at=SimpleNamespace(is_=lambda *_: None)
            )
        ):
            snapshots = ParticipacionRelevanteService.snapshot_para_memoria_version(
                version,
                user_id=14
            )

        self.assertEqual(len(snapshots), 1)
        self.assertEqual(snapshots[0].participacion_relevante_id, 7)
        self.assertEqual(snapshots[0].investigador_nombre, "Ana Perez")
        self.assertEqual(snapshots[0].created_by, 14)
        self.mock_add.assert_called()

    def test_change_status_a_cerrada_genera_snapshot_participaciones_relevantes(self):
        memoria = Memoria(
            id=1,
            periodo_inicio=date(2026, 1, 1),
            periodo_fin=date(2026, 12, 31),
            created_by=1
        )
        version = MemoriaVersion(
            id=6,
            numero_version=1,
            fecha_apertura=datetime(2026, 1, 1, 0, 0, 0),
            estado=EstadoMemoria.EN_REVISION,
            created_by=1
        )
        version.deleted_at = None
        memoria.deleted_at = None
        memoria.version_actual = version
        memoria.version_actual_id = version.id
        memoria.versiones = [version]
        self.mock_get.return_value = memoria

        with patch(
            "core.services.memoria_service.snapshot_investigadores_para_memoria_version"
        ), patch(
            "core.services.memoria_service.snapshot_becarios_para_memoria_version"
        ), patch(
            "core.services.memoria_service.snapshot_personal_para_memoria_version"
        ), patch(
            "core.services.memoria_service.ProyectoInvestigacionService.snapshot_para_memoria_version"
        ), patch(
            "core.services.memoria_service.ActividadDocenciaService.snapshot_para_memoria_version"
        ), patch(
            "core.services.memoria_service.ParticipacionRelevanteService.snapshot_para_memoria_version"
        ) as mock_snapshot:
            with patch(
                "core.services.memoria_service.DocumentacionBibliograficaService.snapshot_para_memoria_version"
            ), patch(
                "core.services.memoria_service.EquipamientoService.snapshot_para_memoria_version"
            ), patch(
                "core.services.memoria_service.ErogacionService.snapshot_para_memoria_version"
            ), patch(
                "core.services.memoria_service.TransferenciaSocioProductivaService.snapshot_para_memoria_version"
            ), patch(
                "core.services.memoria_service.TrabajoReunionCientificaService.snapshot_para_memoria_version"
            ):
                resultado = MemoriaService.change_status(
                    1,
                    {"estado": "cerrada"},
                    user_id=71
                )

        self.assertEqual(version.estado, EstadoMemoria.CERRADA)
        mock_snapshot.assert_called_once_with(version, 71)
        self.assertEqual(resultado["version_actual"]["estado"], "cerrada")

    def test_obtener_historial_participacion_relevante_retorna_auditoria_ordenada(self):
        auditoria = AuditoriaCampo(
            id=1,
            entidad="participacion_relevante",
            registro_id=7,
            campo="forma_participacion",
            valor_anterior="panelista",
            valor_nuevo="expositor",
            fecha_cambio=datetime(2026, 4, 23, 10, 0, 0),
            usuario_id=3
        )
        auditoria.usuario = SimpleNamespace(nombre_usuario="admin")

        fake_query = SimpleNamespace(
            filter=lambda *args, **kwargs: SimpleNamespace(
                order_by=lambda *a, **k: SimpleNamespace(all=lambda: [auditoria])
            )
        )

        with patch(
            "core.services.participacion_relevante_service.ParticipacionRelevanteService._get_or_404",
            return_value=SimpleNamespace(id=7)
        ), patch(
            "core.services.auditoria_service.AuditoriaCampo",
            new=SimpleNamespace(
                query=fake_query,
                entidad=None,
                registro_id=None,
                fecha_cambio=SimpleNamespace(desc=lambda: None),
                id=SimpleNamespace(desc=lambda: None)
            )
        ):
            historial = ParticipacionRelevanteService.get_historial(7)

        self.assertEqual(len(historial), 1)
        self.assertEqual(historial[0]["campo"], "forma_participacion")
        self.assertEqual(historial[0]["usuario_nombre"], "admin")

    def test_obtener_snapshots_participacion_relevante_por_memoria_version(self):
        snapshot = SimpleNamespace(
            serialize=lambda: {
                "participacion_relevante_id": 7,
                "nombre_evento": "Congreso A",
                "memoria_version_id": 25
            }
        )

        fake_query = SimpleNamespace(
            filter=lambda *args, **kwargs: SimpleNamespace(
                order_by=lambda *a, **k: SimpleNamespace(all=lambda: [snapshot])
            )
        )

        with patch(
            "core.services.participacion_relevante_service.ParticipacionRelevanteMemoriaVersion",
            new=SimpleNamespace(
                query=fake_query,
                memoria_version_id=None,
                deleted_at=SimpleNamespace(is_=lambda *_: None),
                fecha=SimpleNamespace(desc=lambda: None)
            )
        ):
            resultado = ParticipacionRelevanteService.obtener_snapshots_por_memoria_version(25)

        self.assertEqual(len(resultado), 1)
        self.assertEqual(resultado[0]["participacion_relevante_id"], 7)
        self.assertEqual(resultado[0]["memoria_version_id"], 25)


if __name__ == "__main__":
    unittest.main()
