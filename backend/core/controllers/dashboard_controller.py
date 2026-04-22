from datetime import date

from flask import jsonify, request

from core.services.dashboard_service import DashboardService


class DashboardController:
    @staticmethod
    def get_resumen():
        try:
            anios = request.args.get("anios", default=5, type=int)
            solo_becarios_con_beca_activa = DashboardController._parse_bool(
                request.args.get("solo_becarios_con_beca_activa"),
                "solo_becarios_con_beca_activa"
            )
            fecha_desde = DashboardController._parse_fecha(
                request.args.get("fecha_desde"),
                "fecha_desde"
            )
            fecha_hasta = DashboardController._parse_fecha(
                request.args.get("fecha_hasta"),
                "fecha_hasta"
            )

            if anios is None or anios <= 0:
                return jsonify({
                    "error": 'El parámetro "anios" debe ser un entero mayor a 0'
                }), 400

            if fecha_desde and fecha_hasta and fecha_desde > fecha_hasta:
                return jsonify({
                    "error": '"fecha_desde" no puede ser mayor que "fecha_hasta"'
                }), 400

            return jsonify(
                DashboardService.get_resumen(
                    anios=anios,
                    fecha_desde=fecha_desde,
                    fecha_hasta=fecha_hasta,
                    solo_becarios_con_beca_activa=solo_becarios_con_beca_activa
                )
            ), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def _parse_fecha(valor, nombre_parametro):
        if not valor:
            return None

        try:
            return date.fromisoformat(valor)
        except ValueError:
            raise ValueError(
                f'El parámetro "{nombre_parametro}" debe tener formato YYYY-MM-DD'
            )

    @staticmethod
    def _parse_bool(valor, nombre_parametro):
        if valor is None or valor == "":
            return False

        valor_normalizado = valor.strip().lower()
        if valor_normalizado in ("true", "1", "si", "sí"):
            return True
        if valor_normalizado in ("false", "0", "no"):
            return False

        raise ValueError(
            f'El parámetro "{nombre_parametro}" debe ser booleano'
        )
