import unittest
from datetime import datetime
from unittest.mock import patch

from core.services.catalogo_auditoria_service import CatalogoAuditoriaService


class CatalogoPrueba:
    __tablename__ = "catalogo_prueba"

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


class CatalogoAuditoriaServiceTestCase(unittest.TestCase):

    def test_marcar_creacion_solo_asigna_usuario_creador(self):
        catalogo = CatalogoPrueba(id=1, created_by=None)

        CatalogoAuditoriaService.marcar_creacion(catalogo, user_id=7)

        self.assertEqual(catalogo.created_by, 7)

    def test_marcar_actualizacion_registra_cambios_de_catalogo(self):
        catalogo = CatalogoPrueba(
            id=2,
            nombre="Anterior",
            updated_by=None,
            updated_at=None,
        )

        def mark_updated(user_id):
            catalogo.updated_by = user_id
            catalogo.updated_at = datetime(2026, 6, 10, 10, 0, 0)

        catalogo.mark_updated = mark_updated

        cambios = CatalogoAuditoriaService.construir_cambios(
            catalogo,
            {"nombre": "Nuevo", "campo_inexistente": "ignorado"},
        )

        with patch(
            "modules.shared.services.catalogo_auditoria_service."
            "AuditoriaService.registrar_cambios"
        ) as mock_registrar:
            CatalogoAuditoriaService.marcar_actualizacion(
                catalogo,
                cambios,
                user_id=8,
            )

        self.assertEqual(catalogo.updated_by, 8)
        self.assertIn("nombre", cambios)
        self.assertNotIn("campo_inexistente", cambios)
        mock_registrar.assert_called_once_with(
            "catalogo_prueba",
            2,
            cambios,
            user_id=8,
        )

    def test_marcar_baja_inactiva_y_registra_accion_sistema(self):
        catalogo = CatalogoPrueba(id=3, activo=True)

        def soft_delete(user_id):
            catalogo.activo = False
            catalogo.deleted_by = user_id

        catalogo.soft_delete = soft_delete

        with patch(
            "modules.shared.services.catalogo_auditoria_service."
            "AuditoriaService.registrar_cambios"
        ) as mock_cambios, patch(
            "modules.shared.services.catalogo_auditoria_service."
            "AuditoriaService.registrar_evento_relacion"
        ) as mock_evento:
            CatalogoAuditoriaService.marcar_baja(catalogo, user_id=9)

        self.assertFalse(catalogo.activo)
        self.assertEqual(catalogo.deleted_by, 9)
        mock_cambios.assert_called_once()
        mock_evento.assert_called_once_with(
            "catalogo_prueba",
            3,
            "accion_sistema",
            "inactivar",
            {},
            user_id=9,
        )


if __name__ == "__main__":
    unittest.main()
