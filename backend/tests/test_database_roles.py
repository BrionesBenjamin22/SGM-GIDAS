import os
import unittest
from unittest.mock import MagicMock, patch

from tools import manage_database_roles


class DatabaseRolesTestCase(unittest.TestCase):
    def test_required_rechaza_variable_vacia(self):
        with patch.dict(os.environ, {"POSTGRES_APP_USER": ""}):
            with self.assertRaises(RuntimeError):
                manage_database_roles.required("POSTGRES_APP_USER")

    @patch("tools.manage_database_roles.connection")
    def test_prepare_crea_rol_limitado_si_no_existe(self, connection):
        cursor = MagicMock()
        cursor.fetchone.return_value = None
        connection.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = cursor
        with patch.dict(os.environ, {"POSTGRES_APP_USER": "gidas_app", "POSTGRES_APP_PASSWORD": "segura"}):
            manage_database_roles.prepare()
        command = repr(cursor.execute.call_args_list[1].args[0])
        self.assertIn("CREATE ROLE", command)
        self.assertIn("NOSUPERUSER", command)
        self.assertIn("NOCREATEDB", command)
        self.assertIn("NOCREATEROLE", command)

    @patch("tools.manage_database_roles.connection")
    def test_grant_concede_dml_y_revoca_create(self, connection):
        cursor = MagicMock()
        connection.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value = cursor
        with patch.dict(os.environ, {"POSTGRES_APP_USER": "gidas_app", "POSTGRES_DB": "gidas_db"}):
            manage_database_roles.grant()
        commands = " ".join(repr(call.args[0]) for call in cursor.execute.call_args_list)
        self.assertIn("REVOKE CREATE ON SCHEMA", commands)
        self.assertIn("SELECT, INSERT, UPDATE, DELETE", commands)
        self.assertIn("ALTER DEFAULT PRIVILEGES", commands)


if __name__ == "__main__":
    unittest.main()
