import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import patch

from core.models.becas import Beca
from core.models.distinciones import DistincionRecibida
from core.models.erogacion import Erogacion
from core.models.transferencia_socio import TransferenciaSocioProductiva
from core.models.trabajo_reunion import TrabajoReunionCientifica
from core.models.trabajo_revista import TrabajosRevistasReferato
from core.services.becas_service import BecaService
from core.services.distincion_service import DistincionRecibidaService
from core.services.erogacion_service import ErogacionService
from core.services.transferencia_service import (
    TransferenciaSocioProductivaService,
)
from core.services.trabajo_reunion_service import (
    TrabajoReunionCientificaService,
)
from core.services.trabajo_revista_service import (
    TrabajosRevistasReferatoService,
)


class AuditoriaTanda3ServicesTestCase(unittest.TestCase):

    def setUp(self):
        self.commit_patcher = patch("extension.db.session.commit")
        self.rollback_patcher = patch("extension.db.session.rollback")
        self.add_patcher = patch("extension.db.session.add")

        self.mock_commit = self.commit_patcher.start()
        self.mock_rollback = self.rollback_patcher.start()
        self.mock_add = self.add_patcher.start()

        self.addCleanup(self.commit_patcher.stop)
        self.addCleanup(self.rollback_patcher.stop)
        self.addCleanup(self.add_patcher.stop)

    def test_update_erogacion_registra_auditoria(self):
        erogacion = Erogacion(
            id=1,
            numero_erogacion=10,
            egresos=100.0,
            ingresos=50.0,
            fecha=date(2024, 1, 1),
            tipo_erogacion_id=1,
            fuente_financiamiento_id=2,
            grupo_utn_id=3,
            created_by=1
        )
        erogacion.deleted_at = None
        erogacion.updated_at = None
        erogacion.updated_by = None

        with patch(
            "core.services.erogacion_service.ErogacionService._get_activa_or_404",
            return_value=erogacion
        ), patch(
            "core.services.erogacion_service.AuditoriaService.registrar_cambios"
        ) as mock_registrar:
            resultado = ErogacionService.update(
                1,
                {"egresos": 120, "ingresos": 80},
                user_id=11
            )

        self.assertEqual(resultado["egresos"], 120.0)
        self.assertEqual(resultado["ingresos"], 80.0)
        self.assertEqual(erogacion.updated_by, 11)
        self.assertIsNotNone(erogacion.updated_at)
        mock_registrar.assert_called_once()

    def test_update_beca_registra_auditoria(self):
        beca = Beca(
            id=2,
            nombre_beca="Beca Inicial",
            descripcion="Descripcion original",
            fuente_financiamiento_id=1,
            created_by=1
        )
        beca.deleted_at = None
        beca.updated_at = None
        beca.updated_by = None

        with patch(
            "core.services.becas_service._get_beca_activa_or_404",
            return_value=beca
        ), patch(
            "core.services.becas_service._validar_beca_unica"
        ), patch(
            "core.services.becas_service._validar_fuente_financiamiento",
            return_value=3
        ), patch(
            "core.services.becas_service.AuditoriaService.registrar_cambios"
        ) as mock_registrar:
            resultado = BecaService.update(
                2,
                {
                    "nombre_beca": "Beca Actualizada",
                    "descripcion": "Nueva descripcion",
                    "fuente_financiamiento_id": 3
                },
                user_id=12
            )

        self.assertEqual(resultado["nombre_beca"], "Beca Actualizada")
        self.assertEqual(resultado["descripcion"], "Nueva descripcion")
        self.assertEqual(resultado["fuente_financiamiento_id"], 3)
        self.assertEqual(beca.updated_by, 12)
        self.assertIsNotNone(beca.updated_at)
        mock_registrar.assert_called_once()

    def test_update_distincion_registra_auditoria(self):
        distincion = DistincionRecibida(
            id=3,
            fecha=date(2024, 2, 1),
            descripcion="Descripcion inicial",
            proyecto_investigacion_id=5,
            created_by=1
        )
        distincion.deleted_at = None
        distincion.updated_at = None
        distincion.updated_by = None

        with patch(
            "core.services.distincion_service.DistincionRecibidaService._get_activa_or_404",
            return_value=distincion
        ), patch(
            "core.services.distincion_service.DistincionRecibidaService._validar_no_duplicado"
        ), patch(
            "core.services.distincion_service.DistincionRecibidaService._validar_proyecto",
            return_value=8
        ), patch(
            "core.services.distincion_service.AuditoriaService.registrar_cambios"
        ) as mock_registrar:
            resultado = DistincionRecibidaService.update(
                3,
                {
                    "descripcion": "Descripcion actualizada",
                    "proyecto_investigacion_id": 8
                },
                user_id=13
            )

        self.assertEqual(resultado["descripcion"], "Descripcion actualizada")
        self.assertIsNone(resultado["proyecto"])
        self.assertEqual(distincion.updated_by, 13)
        self.assertIsNotNone(distincion.updated_at)
        mock_registrar.assert_called_once()

    def test_update_transferencia_registra_auditoria(self):
        transferencia = TransferenciaSocioProductiva(
            id=4,
            numero_transferencia=15,
            denominacion="Transferencia inicial",
            demandante="Empresa A",
            descripcion_actividad="Descripcion muy extensa original",
            monto=1000.0,
            fecha_inicio=date(2024, 1, 10),
            fecha_fin=None,
            tipo_contrato_id=1,
            grupo_utn_id=2,
            created_by=1
        )
        transferencia.deleted_at = None
        transferencia.updated_at = None
        transferencia.updated_by = None

        with patch(
            "core.services.transferencia_service.db.session.get",
            return_value=transferencia
        ), patch(
            "core.services.transferencia_service.AuditoriaService.registrar_cambios"
        ) as mock_registrar:
            resultado = TransferenciaSocioProductivaService.update(
                4,
                {
                    "denominacion": "Transferencia actualizada",
                    "monto": 1500,
                    "fecha_fin": "2024-12-31"
                },
                user_id=14
            )

        self.assertEqual(resultado["denominacion"], "Transferencia actualizada")
        self.assertEqual(resultado["monto"], 1500.0)
        self.assertEqual(resultado["fecha_fin"], "2024-12-31")
        self.assertEqual(transferencia.updated_by, 14)
        self.assertIsNotNone(transferencia.updated_at)
        mock_registrar.assert_called_once()

    def test_update_trabajo_reunion_registra_auditoria(self):
        trabajo = TrabajoReunionCientifica(
            id=5,
            titulo_trabajo="Trabajo inicial",
            nombre_reunion="Reunion inicial",
            procedencia="Nacional",
            fecha_inicio=date(2024, 3, 1),
            tipo_reunion_id=1,
            grupo_utn_id=2,
            created_by=1
        )
        trabajo.deleted_at = None
        trabajo.updated_at = None
        trabajo.updated_by = None

        with patch(
            "core.services.trabajo_reunion_service.TrabajoReunionCientificaService._get_activo_or_404",
            return_value=trabajo
        ), patch(
            "core.services.trabajo_reunion_service.TrabajoReunionCientificaService._validar_no_duplicado"
        ), patch(
            "core.services.trabajo_reunion_service.TrabajoReunionCientificaService._validar_tipo_reunion",
            return_value=3
        ), patch(
            "core.services.trabajo_reunion_service.TrabajoReunionCientificaService._validar_grupo",
            return_value=4
        ), patch(
            "core.services.trabajo_reunion_service.AuditoriaService.registrar_cambios"
        ) as mock_registrar:
            resultado = TrabajoReunionCientificaService.update(
                5,
                {
                    "titulo_trabajo": "Trabajo actualizado",
                    "tipo_reunion_id": 3,
                    "grupo_utn_id": 4
                },
                user_id=15
            )

        self.assertEqual(resultado["titulo_trabajo"], "Trabajo actualizado")
        self.assertEqual(resultado["tipo_reunion_id"], 3)
        self.assertEqual(resultado["grupo_utn_id"], 4)
        self.assertEqual(trabajo.updated_by, 15)
        self.assertIsNotNone(trabajo.updated_at)
        mock_registrar.assert_called_once()

    def test_update_trabajo_revista_registra_auditoria(self):
        trabajo = TrabajosRevistasReferato(
            id=6,
            titulo_trabajo="Titulo inicial",
            nombre_revista="Revista inicial",
            editorial="Editorial inicial",
            issn="1234-5678",
            pais="Argentina",
            fecha=date(2024, 4, 1),
            grupo_utn_id=1,
            tipo_reunion_id=2,
            created_by=1
        )
        trabajo.deleted_at = None
        trabajo.updated_at = None
        trabajo.updated_by = None

        with patch(
            "core.services.trabajo_revista_service.TrabajosRevistasReferatoService._get_activo_or_404",
            return_value=trabajo
        ), patch(
            "core.services.trabajo_revista_service.TrabajosRevistasReferatoService._validar_no_duplicado"
        ), patch(
            "core.services.trabajo_revista_service.TrabajosRevistasReferatoService._validar_grupo",
            return_value=5
        ), patch(
            "core.services.trabajo_revista_service.TrabajosRevistasReferatoService._validar_tipo_reunion",
            return_value=6
        ), patch(
            "core.services.trabajo_revista_service.AuditoriaService.registrar_cambios"
        ) as mock_registrar:
            resultado = TrabajosRevistasReferatoService.update(
                6,
                {
                    "titulo_trabajo": "Titulo actualizado",
                    "pais": "Chile",
                    "grupo_utn_id": 5,
                    "tipo_reunion_id": 6
                },
                user_id=16
            )

        self.assertEqual(resultado["titulo_trabajo"], "Titulo actualizado")
        self.assertEqual(resultado["pais"], "Chile")
        self.assertEqual(resultado["grupo_utn_id"], 5)
        self.assertEqual(resultado["tipo_reunion_id"], 6)
        self.assertEqual(trabajo.updated_by, 16)
        self.assertIsNotNone(trabajo.updated_at)
        mock_registrar.assert_called_once()

    def test_update_beca_no_audita_si_no_hay_cambios(self):
        beca = Beca(
            id=7,
            nombre_beca="Beca Igual",
            descripcion="Misma descripcion",
            fuente_financiamiento_id=2,
            created_by=1
        )
        beca.deleted_at = None
        beca.updated_at = None
        beca.updated_by = None

        with patch(
            "core.services.becas_service._get_beca_activa_or_404",
            return_value=beca
        ), patch(
            "core.services.becas_service._validar_beca_unica"
        ), patch(
            "core.services.becas_service._validar_fuente_financiamiento",
            return_value=2
        ), patch(
            "core.services.becas_service.AuditoriaService.registrar_cambios"
        ) as mock_registrar:
            BecaService.update(
                7,
                {
                    "nombre_beca": "Beca Igual",
                    "descripcion": "Misma descripcion",
                    "fuente_financiamiento_id": 2
                },
                user_id=20
            )

        self.assertIsNone(beca.updated_at)
        self.assertIsNone(beca.updated_by)
        mock_registrar.assert_not_called()


if __name__ == "__main__":
    unittest.main()
