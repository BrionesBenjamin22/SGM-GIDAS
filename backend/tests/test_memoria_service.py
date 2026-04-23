import unittest
from datetime import date, datetime
from unittest.mock import patch

from core.models.memorias import EstadoMemoria, Memoria, MemoriaVersion
from core.services.memoria_service import MemoriaService


class MemoriaServiceTestCase(unittest.TestCase):

    def setUp(self):
        self.add_patcher = patch("core.services.memoria_service.db.session.add")
        self.flush_patcher = patch("core.services.memoria_service.db.session.flush")
        self.commit_patcher = patch("core.services.memoria_service.db.session.commit")
        self.rollback_patcher = patch("core.services.memoria_service.db.session.rollback")
        self.get_patcher = patch("core.services.memoria_service.db.session.get")

        self.mock_add = self.add_patcher.start()
        self.mock_flush = self.flush_patcher.start()
        self.mock_commit = self.commit_patcher.start()
        self.mock_rollback = self.rollback_patcher.start()
        self.mock_get = self.get_patcher.start()

        self.addCleanup(self.add_patcher.stop)
        self.addCleanup(self.flush_patcher.stop)
        self.addCleanup(self.commit_patcher.stop)
        self.addCleanup(self.rollback_patcher.stop)
        self.addCleanup(self.get_patcher.stop)

    def _make_memoria(self):
        memoria = Memoria(
            id=1,
            periodo_inicio=date(2026, 1, 1),
            periodo_fin=date(2026, 12, 31),
            created_by=1
        )
        memoria.versiones = []
        memoria.version_actual = None
        memoria.version_actual_id = None
        memoria.deleted_at = None
        return memoria

    def _make_version(self, memoria, numero=1, estado=EstadoMemoria.ABIERTA):
        version = MemoriaVersion(
            id=numero,
            numero_version=numero,
            fecha_apertura=datetime(2026, 1, 1, 0, 0, 0),
            fecha_cierre=None,
            estado=estado,
            memoria=memoria,
            created_by=1
        )
        version.deleted_at = None
        return version

    def test_create_crea_memoria_con_version_inicial_abierta(self):
        created_objects = {}

        def add_side_effect(obj):
            if isinstance(obj, Memoria):
                created_objects["memoria"] = obj
            elif isinstance(obj, MemoriaVersion):
                created_objects["version"] = obj

        def flush_side_effect():
            memoria = created_objects.get("memoria")
            version = created_objects.get("version")

            if memoria and memoria.id is None:
                memoria.id = 1
            if version and version.id is None:
                version.id = 1

        def commit_side_effect():
            memoria = created_objects["memoria"]
            version = created_objects["version"]
            memoria.version_actual = version
            memoria.version_actual_id = version.id
            memoria.versiones = [version]

        self.mock_add.side_effect = add_side_effect
        self.mock_flush.side_effect = flush_side_effect
        self.mock_commit.side_effect = commit_side_effect

        resultado = MemoriaService.create(
            {
                "periodo_inicio": "2026-01-01",
                "periodo_fin": "2026-12-31",
                "fecha_apertura": "2026-01-10 08:00:00"
            },
            user_id=7
        )

        self.assertEqual(resultado["periodo_inicio"], "2026-01-01")
        self.assertEqual(resultado["periodo_fin"], "2026-12-31")
        self.assertIsNotNone(resultado["version_actual"])
        self.assertEqual(resultado["version_actual"]["numero_version"], 1)
        self.assertEqual(resultado["version_actual"]["estado"], "abierta")
        self.assertEqual(resultado["cantidad_versiones"], 1)
        self.assertEqual(created_objects["memoria"].created_by, 7)
        self.mock_commit.assert_called_once()

    def test_update_falla_porque_memoria_es_inmutable(self):
        with self.assertRaises(ValueError) as ctx:
            MemoriaService.update(1, {"periodo_inicio": "2026-01-01"})

        self.assertEqual(
            str(ctx.exception),
            "La memoria no puede modificarse una vez creada"
        )

    def test_change_status_a_en_revision_actualiza_estado_sin_fecha_cierre(self):
        memoria = self._make_memoria()
        version = self._make_version(memoria, estado=EstadoMemoria.ABIERTA)
        memoria.version_actual = version
        memoria.version_actual_id = version.id
        memoria.versiones = [version]

        self.mock_get.return_value = memoria

        resultado = MemoriaService.change_status(
            memoria.id,
            {"estado": "en revision"}
        )

        self.assertEqual(version.estado, EstadoMemoria.EN_REVISION)
        self.assertIsNone(version.fecha_cierre)
        self.assertEqual(resultado["version_actual"]["estado"], "en revision")
        self.mock_commit.assert_called_once()

    def test_change_status_a_cerrada_setea_fecha_cierre(self):
        memoria = self._make_memoria()
        version = self._make_version(memoria, estado=EstadoMemoria.EN_REVISION)
        memoria.version_actual = version
        memoria.version_actual_id = version.id
        memoria.versiones = [version]

        self.mock_get.return_value = memoria

        resultado = MemoriaService.change_status(
            memoria.id,
            {
                "estado": "cerrada",
                "fecha_cierre": "2026-02-15 14:30:00"
            }
        )

        self.assertEqual(version.estado, EstadoMemoria.CERRADA)
        self.assertEqual(
            version.fecha_cierre,
            datetime(2026, 2, 15, 14, 30, 0)
        )
        self.assertEqual(resultado["version_actual"]["estado"], "cerrada")
        self.mock_commit.assert_called_once()

    def test_reopen_crea_nueva_version_sin_mutar_la_cerrada(self):
        memoria = self._make_memoria()
        version_cerrada = self._make_version(
            memoria,
            numero=1,
            estado=EstadoMemoria.CERRADA
        )
        version_cerrada.fecha_cierre = datetime(2026, 3, 1, 12, 0, 0)
        memoria.version_actual = version_cerrada
        memoria.version_actual_id = version_cerrada.id
        memoria.versiones = [version_cerrada]
        versiones_creadas = []

        self.mock_get.return_value = memoria

        def add_side_effect(obj):
            if isinstance(obj, MemoriaVersion):
                versiones_creadas.append(obj)

        def flush_side_effect():
            for index, version in enumerate(versiones_creadas, start=2):
                if version.id is None:
                    version.id = index

        def commit_side_effect():
            nueva_version = versiones_creadas[0]
            memoria.version_actual = nueva_version
            memoria.version_actual_id = nueva_version.id
            memoria.versiones = [version_cerrada, nueva_version]

        self.mock_add.side_effect = add_side_effect
        self.mock_flush.side_effect = flush_side_effect
        self.mock_commit.side_effect = commit_side_effect

        resultado = MemoriaService.reopen(
            memoria.id,
            user_id=9,
            data={"fecha_apertura": "2026-03-05"}
        )

        self.assertEqual(len(versiones_creadas), 1)
        nueva_version = versiones_creadas[0]

        self.assertEqual(version_cerrada.estado, EstadoMemoria.CERRADA)
        self.assertEqual(nueva_version.numero_version, 2)
        self.assertEqual(nueva_version.estado, EstadoMemoria.ABIERTA)
        self.assertIsNone(nueva_version.fecha_cierre)
        self.assertEqual(memoria.version_actual_id, nueva_version.id)
        self.assertEqual(resultado["version_actual"]["numero_version"], 2)
        self.assertEqual(resultado["version_actual"]["estado"], "abierta")
        self.mock_commit.assert_called_once()

    def test_reopen_falla_si_la_version_actual_no_esta_cerrada(self):
        memoria = self._make_memoria()
        version = self._make_version(memoria, estado=EstadoMemoria.ABIERTA)
        memoria.version_actual = version
        memoria.version_actual_id = version.id
        memoria.versiones = [version]

        self.mock_get.return_value = memoria

        with self.assertRaises(ValueError) as ctx:
            MemoriaService.reopen(memoria.id, user_id=3)

        self.assertEqual(
            str(ctx.exception),
            "Solo se puede crear una nueva version a partir de una memoria cerrada"
        )


if __name__ == "__main__":
    unittest.main()
