import unittest
from datetime import date, datetime
from types import SimpleNamespace

from modules.memorias.services.memoria_periodo_service import (
    estuvo_activo_en_periodo_memoria,
)


class MemoriaPeriodoServiceTestCase(unittest.TestCase):

    def test_retorna_true_si_estuvo_activo_durante_el_periodo(self):
        memoria_version = SimpleNamespace(
            memoria=SimpleNamespace(
                periodo_inicio=date(2025, 1, 1),
                periodo_fin=date(2025, 12, 31)
            )
        )

        resultado = estuvo_activo_en_periodo_memoria(
            memoria_version,
            fecha_alta=date(2018, 6, 10),
            fecha_baja=datetime(2025, 3, 15, 10, 0, 0)
        )

        self.assertTrue(resultado)

    def test_retorna_false_si_fue_dado_de_baja_antes_del_periodo(self):
        memoria_version = SimpleNamespace(
            memoria=SimpleNamespace(
                periodo_inicio=date(2025, 1, 1),
                periodo_fin=date(2025, 12, 31)
            )
        )

        resultado = estuvo_activo_en_periodo_memoria(
            memoria_version,
            fecha_alta=date(2018, 6, 10),
            fecha_baja=datetime(2024, 12, 31, 23, 59, 59)
        )

        self.assertFalse(resultado)

    def test_retorna_false_si_se_da_de_alta_despues_del_periodo(self):
        memoria_version = SimpleNamespace(
            memoria=SimpleNamespace(
                periodo_inicio=date(2025, 1, 1),
                periodo_fin=date(2025, 12, 31)
            )
        )

        resultado = estuvo_activo_en_periodo_memoria(
            memoria_version,
            fecha_alta=date(2026, 1, 1),
            fecha_baja=None
        )

        self.assertFalse(resultado)


if __name__ == "__main__":
    unittest.main()
