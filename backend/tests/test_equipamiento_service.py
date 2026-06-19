import unittest
from datetime import date
from unittest.mock import patch

from modules.recursos.models.equipamiento import Equipamiento
from modules.recursos.services.equipamiento_service import EquipamientoService


class EquipamientoServiceTestCase(unittest.TestCase):

    def setUp(self):
        self.commit_patcher = patch("modules.recursos.services.equipamiento_service.db.session.commit")
        self.rollback_patcher = patch("modules.recursos.services.equipamiento_service.db.session.rollback")
        self.get_activo_patcher = patch(
            "modules.recursos.services.equipamiento_service.EquipamientoService._get_activo_or_404"
        )
        self.validar_grupo_patcher = patch(
            "modules.recursos.services.equipamiento_service.EquipamientoService._validar_grupo"
        )
        self.registrar_cambios_patcher = patch(
            "modules.recursos.services.equipamiento_service.AuditoriaService.registrar_cambios"
        )

        self.mock_commit = self.commit_patcher.start()
        self.mock_rollback = self.rollback_patcher.start()
        self.mock_get_activo = self.get_activo_patcher.start()
        self.mock_validar_grupo = self.validar_grupo_patcher.start()
        self.mock_registrar_cambios = self.registrar_cambios_patcher.start()

        self.addCleanup(self.commit_patcher.stop)
        self.addCleanup(self.rollback_patcher.stop)
        self.addCleanup(self.get_activo_patcher.stop)
        self.addCleanup(self.validar_grupo_patcher.stop)
        self.addCleanup(self.registrar_cambios_patcher.stop)

    def _make_equipamiento(self):
        equipamiento = Equipamiento(
            id=1,
            denominacion="Microscopio",
            descripcion_breve="Equipo inicial",
            fecha_incorporacion=date(2024, 1, 10),
            monto_invertido=1500.0,
            grupo_utn_id=2,
            created_by=1
        )
        equipamiento.deleted_at = None
        equipamiento.updated_at = None
        equipamiento.updated_by = None
        return equipamiento

    def test_update_registra_auditoria_cuando_hay_cambios(self):
        equipamiento = self._make_equipamiento()
        self.mock_get_activo.return_value = equipamiento
        self.mock_validar_grupo.return_value = 3

        resultado = EquipamientoService.update(
            equipamiento_id=1,
            data={
                "denominacion": "Microscopio electronico",
                "monto_invertido": 2000,
                "grupo_utn_id": 3
            },
            user_id=99
        )

        self.assertEqual(equipamiento.denominacion, "Microscopio electronico")
        self.assertEqual(equipamiento.monto_invertido, 2000.0)
        self.assertEqual(equipamiento.grupo_utn_id, 3)
        self.assertEqual(equipamiento.updated_by, 99)
        self.assertIsNotNone(equipamiento.updated_at)
        self.assertEqual(resultado["updated_by"], 99)
        self.mock_registrar_cambios.assert_called_once()
        self.mock_commit.assert_called_once()

    def test_update_no_registra_auditoria_si_no_hay_cambios_reales(self):
        equipamiento = self._make_equipamiento()
        self.mock_get_activo.return_value = equipamiento
        self.mock_validar_grupo.return_value = 2

        EquipamientoService.update(
            equipamiento_id=1,
            data={
                "denominacion": "Microscopio",
                "grupo_utn_id": 2
            },
            user_id=50
        )

        self.assertIsNone(equipamiento.updated_at)
        self.assertIsNone(equipamiento.updated_by)
        self.mock_registrar_cambios.assert_not_called()
        self.mock_commit.assert_called_once()


if __name__ == "__main__":
    unittest.main()
