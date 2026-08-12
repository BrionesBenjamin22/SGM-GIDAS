import unittest
from unittest.mock import patch

from modules import models_registry  # noqa: F401
from modules.grupo.models.programa_actividades import PlanificacionGrupo
from modules.grupo.services.programa_actividades_service import (
    actualizar_planificacion_grupo,
    obtener_historial_planificacion,
)


class PlanificacionHistorialTestCase(unittest.TestCase):

    def test_actualizacion_registra_solo_cambios_reales(self):
        plan = PlanificacionGrupo(
            id=4,
            descripcion="Original",
            anio=2026,
            grupo_id=3,
            created_by=1,
        )
        plan.deleted_at = None

        with patch("extension.db.session.get", return_value=plan), patch(
            "modules.grupo.services.programa_actividades_service._validar_planificacion_unica"
        ), patch(
            "modules.grupo.services.programa_actividades_service.AuditoriaService.registrar_cambios"
        ) as audit, patch("extension.db.session.commit"):
            actualizar_planificacion_grupo(
                4,
                {"descripcion": "Actualizada", "anio": 2026},
                user_id=8,
            )

        self.assertEqual(plan.descripcion, "Actualizada")
        self.assertEqual(plan.updated_by, 8)
        cambios = audit.call_args.kwargs["cambios"]
        self.assertEqual(set(cambios), {"descripcion"})

    def test_historial_usa_entidad_estable(self):
        plan = PlanificacionGrupo(id=4, descripcion="Original", anio=2026, grupo_id=3)
        with patch("extension.db.session.get", return_value=plan), patch(
            "modules.grupo.services.programa_actividades_service.AuditoriaService.obtener_historial_entidad",
            return_value=[{"id": 1}],
        ) as history:
            result = obtener_historial_planificacion(4)

        self.assertEqual(result, [{"id": 1}])
        history.assert_called_once_with(entidad="planificacion_grupo", registro_id=4)


if __name__ == "__main__":
    unittest.main()
