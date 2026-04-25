import unittest
from datetime import date, datetime
from types import SimpleNamespace
from unittest.mock import patch

from core.models.auditoria_campo import AuditoriaCampo
from core.models.memorias import EstadoMemoria, Memoria, MemoriaVersion
from core.services.memoria_service import MemoriaService
from core.services.trabajo_reunion_service import TrabajoReunionCientificaService


class TrabajoReunionMemoriaHistorialTestCase(unittest.TestCase):

    def setUp(self):
        self.add_patcher = patch("core.services.trabajo_reunion_service.db.session.add")
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

    def test_snapshot_trabajo_reunion_para_memoria_version_persiste_foto(self):
        version = MemoriaVersion(
            id=71,
            numero_version=1,
            fecha_apertura=datetime(2026, 1, 1, 0, 0, 0),
            estado=EstadoMemoria.CERRADA,
            created_by=1
        )
        trabajo = SimpleNamespace(
            id=5,
            titulo_trabajo="Arquitectura institucional",
            nombre_reunion="Congreso Nacional",
            procedencia="UTN",
            fecha_inicio=date(2026, 3, 20),
            tipo_reunion_id=2,
            tipo_reunion_cientifica=SimpleNamespace(nombre="Congreso"),
            grupo_utn_id=4,
            grupo_utn=SimpleNamespace(nombre_sigla_grupo="GIDAS"),
            investigadores=[
                SimpleNamespace(nombre_apellido="Ana Perez", deleted_at=None),
                SimpleNamespace(nombre_apellido="Luis Diaz", deleted_at=None)
            ]
        )

        fake_query = SimpleNamespace(
            filter=lambda *args, **kwargs: SimpleNamespace(all=lambda: [trabajo])
        )

        with patch(
            "core.services.trabajo_reunion_service.TrabajoReunionCientifica",
            new=SimpleNamespace(
                query=fake_query,
                deleted_at=SimpleNamespace(is_=lambda *_: None)
            )
        ):
            snapshots = TrabajoReunionCientificaService.snapshot_para_memoria_version(
                version,
                user_id=23
            )

        self.assertEqual(len(snapshots), 1)
        self.assertEqual(snapshots[0].trabajo_reunion_id, 5)
        self.assertEqual(snapshots[0].tipo_reunion_nombre, "Congreso")
        self.assertEqual(
            snapshots[0].investigadores_participantes,
            "Ana Perez, Luis Diaz"
        )
        self.assertEqual(snapshots[0].created_by, 23)
        self.mock_add.assert_called()

    def test_change_status_a_cerrada_genera_snapshot_trabajo_reunion(self):
        memoria = Memoria(
            id=1,
            periodo_inicio=date(2026, 1, 1),
            periodo_fin=date(2026, 12, 31),
            created_by=1
        )
        version = MemoriaVersion(
            id=11,
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
        ), patch(
            "core.services.memoria_service.DocumentacionBibliograficaService.snapshot_para_memoria_version"
        ), patch(
            "core.services.memoria_service.EquipamientoService.snapshot_para_memoria_version"
        ), patch(
            "core.services.memoria_service.ErogacionService.snapshot_para_memoria_version"
        ), patch(
            "core.services.memoria_service.TransferenciaSocioProductivaService.snapshot_para_memoria_version"
        ), patch(
            "core.services.memoria_service.TrabajoReunionCientificaService.snapshot_para_memoria_version"
        ) as mock_snapshot:
            with patch(
                "core.services.memoria_service.TrabajosRevistasReferatoService.snapshot_para_memoria_version"
            ), patch(
                "core.services.memoria_service.DistincionRecibidaService.snapshot_para_memoria_version"
            ):
                resultado = MemoriaService.change_status(
                    1,
                    {"estado": "cerrada"},
                    user_id=95
                )

        self.assertEqual(version.estado, EstadoMemoria.CERRADA)
        mock_snapshot.assert_called_once_with(version, 95)
        self.assertEqual(resultado["version_actual"]["estado"], "cerrada")

    def test_obtener_historial_trabajo_reunion_retorna_auditoria_ordenada(self):
        auditoria = AuditoriaCampo(
            id=1,
            entidad="trabajo_reunion_cientifica",
            registro_id=5,
            campo="titulo_trabajo",
            valor_anterior="Trabajo A",
            valor_nuevo="Trabajo B",
            fecha_cambio=datetime(2026, 4, 25, 10, 0, 0),
            usuario_id=3
        )
        auditoria.usuario = SimpleNamespace(nombre_usuario="admin")

        fake_query = SimpleNamespace(
            filter=lambda *args, **kwargs: SimpleNamespace(
                order_by=lambda *a, **k: SimpleNamespace(all=lambda: [auditoria])
            )
        )

        with patch(
            "core.services.trabajo_reunion_service.db.session.get",
            return_value=SimpleNamespace(id=5)
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
            historial = TrabajoReunionCientificaService.get_historial(5)

        self.assertEqual(len(historial), 1)
        self.assertEqual(historial[0]["campo"], "titulo_trabajo")
        self.assertEqual(historial[0]["usuario_nombre"], "admin")

    def test_obtener_snapshots_trabajo_reunion_por_memoria_version(self):
        snapshot = SimpleNamespace(
            serialize=lambda: {
                "trabajo_reunion_id": 5,
                "titulo_trabajo": "Arquitectura institucional",
                "memoria_version_id": 71
            }
        )

        fake_query = SimpleNamespace(
            filter=lambda *args, **kwargs: SimpleNamespace(
                order_by=lambda *a, **k: SimpleNamespace(all=lambda: [snapshot])
            )
        )

        with patch(
            "core.services.trabajo_reunion_service.TrabajoReunionCientificaMemoriaVersion",
            new=SimpleNamespace(
                query=fake_query,
                memoria_version_id=None,
                deleted_at=SimpleNamespace(is_=lambda *_: None),
                fecha_inicio=SimpleNamespace(desc=lambda: None),
                id=SimpleNamespace(desc=lambda: None)
            )
        ):
            resultado = TrabajoReunionCientificaService.obtener_snapshots_por_memoria_version(71)

        self.assertEqual(len(resultado), 1)
        self.assertEqual(resultado[0]["trabajo_reunion_id"], 5)
        self.assertEqual(resultado[0]["memoria_version_id"], 71)


if __name__ == "__main__":
    unittest.main()
