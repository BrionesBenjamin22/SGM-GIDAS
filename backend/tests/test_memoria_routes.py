import unittest
from unittest.mock import patch

from app import create_app


class MemoriaRoutesTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.testing = True
        self.client = self.app.test_client()

    def _headers(self, token="fake-token"):
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def test_get_all_con_rol_lectura_devuelve_200(self):
        with patch(
            "core.services.middleware.AuthService.verify_token",
            return_value={"sub": "1", "rol": "LECTURA"}
        ), patch(
            "core.controllers.memoria_controller.MemoriaService.get_all",
            return_value=[]
        ) as mock_get_all:
            response = self.client.get("/memorias/", headers=self._headers())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [])
        mock_get_all.assert_called_once_with("true")

    def test_get_by_id_sin_token_devuelve_401(self):
        response = self.client.get("/memorias/1")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()["error"], "Token requerido")

    def test_post_con_rol_lectura_devuelve_403(self):
        with patch(
            "core.services.middleware.AuthService.verify_token",
            return_value={"sub": "2", "rol": "LECTURA"}
        ), patch(
            "core.controllers.memoria_controller.MemoriaService.create"
        ) as mock_create:
            response = self.client.post(
                "/memorias/",
                json={
                    "periodo_inicio": "2026-01-01",
                    "periodo_fin": "2026-12-31"
                },
                headers=self._headers()
            )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.get_json()["error"],
            "No tiene permisos suficientes"
        )
        mock_create.assert_not_called()

    def test_post_con_rol_gestor_devuelve_201(self):
        with patch(
            "core.services.middleware.AuthService.verify_token",
            return_value={"sub": "3", "rol": "GESTOR"}
        ), patch(
            "core.controllers.memoria_controller.MemoriaService.create",
            return_value={"id": 1}
        ) as mock_create:
            payload = {
                "periodo_inicio": "2026-01-01",
                "periodo_fin": "2026-12-31"
            }
            response = self.client.post(
                "/memorias/",
                json=payload,
                headers=self._headers()
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json(), {"id": 1})
        mock_create.assert_called_once_with(payload, 3)

    def test_put_estado_con_rol_gestor_devuelve_200(self):
        with patch(
            "core.services.middleware.AuthService.verify_token",
            return_value={"sub": "4", "rol": "GESTOR"}
        ), patch(
            "core.controllers.memoria_controller.MemoriaService.change_status",
            return_value={"id": 1, "version_actual": {"estado": "cerrada"}}
        ) as mock_change_status:
            payload = {"estado": "cerrada"}
            response = self.client.put(
                "/memorias/1/estado",
                json=payload,
                headers=self._headers()
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {"id": 1, "version_actual": {"estado": "cerrada"}}
        )
        mock_change_status.assert_called_once_with(1, payload)

    def test_delete_con_rol_gestor_devuelve_403(self):
        with patch(
            "core.services.middleware.AuthService.verify_token",
            return_value={"sub": "5", "rol": "GESTOR"}
        ), patch(
            "core.controllers.memoria_controller.MemoriaService.delete"
        ) as mock_delete:
            response = self.client.delete(
                "/memorias/1",
                headers=self._headers()
            )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.get_json()["error"],
            "No tiene permisos suficientes"
        )
        mock_delete.assert_not_called()

    def test_delete_con_rol_admin_devuelve_200(self):
        with patch(
            "core.services.middleware.AuthService.verify_token",
            return_value={"sub": "6", "rol": "ADMIN"}
        ), patch(
            "core.controllers.memoria_controller.MemoriaService.delete",
            return_value={"message": "Memoria eliminada correctamente"}
        ) as mock_delete:
            response = self.client.delete(
                "/memorias/1",
                headers=self._headers()
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {"message": "Memoria eliminada correctamente"}
        )
        mock_delete.assert_called_once_with(1, 6)

    def test_reopen_con_rol_gestor_devuelve_403(self):
        with patch(
            "core.services.middleware.AuthService.verify_token",
            return_value={"sub": "7", "rol": "GESTOR"}
        ), patch(
            "core.controllers.memoria_controller.MemoriaService.reopen"
        ) as mock_reopen:
            response = self.client.put(
                "/memorias/1/reabrir",
                json={"fecha_apertura": "2026-03-05"},
                headers=self._headers()
            )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.get_json()["error"],
            "No tiene permisos suficientes"
        )
        mock_reopen.assert_not_called()

    def test_reopen_con_rol_admin_devuelve_200(self):
        with patch(
            "core.services.middleware.AuthService.verify_token",
            return_value={"sub": "8", "rol": "ADMIN"}
        ), patch(
            "core.controllers.memoria_controller.MemoriaService.reopen",
            return_value={"id": 1, "version_actual": {"numero_version": 2}}
        ) as mock_reopen:
            payload = {"fecha_apertura": "2026-03-05"}
            response = self.client.put(
                "/memorias/1/reabrir",
                json=payload,
                headers=self._headers()
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {"id": 1, "version_actual": {"numero_version": 2}}
        )
        mock_reopen.assert_called_once_with(1, 8, payload)


if __name__ == "__main__":
    unittest.main()
