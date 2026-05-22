import traceback

from flask import jsonify, request, g, send_file

from core.services.memoria_service import MemoriaService
from core.services.exportacion_service_impl import ExportService


class MemoriaController:

    @staticmethod
    def get_all():
        try:
            activos = request.args.get("activos", "true")
            return jsonify(MemoriaService.get_all(activos)), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def get_by_id(memoria_id):
        try:
            return jsonify(
                MemoriaService.get_by_id(memoria_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_investigadores_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_investigadores_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_becarios_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_becarios_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_personal_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_personal_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_proyectos_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_proyectos_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_actividades_docencia_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_actividades_docencia_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_participaciones_relevantes_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_participaciones_relevantes_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_documentacion_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_documentacion_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_equipamiento_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_equipamiento_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_erogaciones_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_erogaciones_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_transferencias_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_transferencias_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_trabajos_reunion_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_trabajos_reunion_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_trabajos_revista_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_trabajos_revista_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_distinciones_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_distinciones_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_registros_propiedad_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_registros_propiedad_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_articulos_divulgacion_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_articulos_divulgacion_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def get_visitas_snapshot(memoria_id, memoria_version_id):
        try:
            return jsonify(
                MemoriaService.get_visitas_snapshot(
                    memoria_id,
                    memoria_version_id
                )
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 404

    @staticmethod
    def exportar_excel(memoria_id, memoria_version_id):
        try:
            archivo = ExportService.generar_excel_memoria(
                memoria_id,
                memoria_version_id
            )
            memoria = MemoriaService.get_by_id(memoria_id)
            versiones = memoria.get("versiones", [])
            version = next(
                (item for item in versiones if item.get("id") == memoria_version_id),
                None
            )
            anio = memoria["periodo_fin"][:4] if memoria.get("periodo_fin") else "memoria"
            numero_version = (
                version.get("numero_version")
                if version and version.get("numero_version") is not None
                else memoria_version_id
            )

            return send_file(
                archivo,
                as_attachment=True,
                download_name=f"memoria_{anio}_v{numero_version}.xlsx",
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
        except Exception as e:
            trace = traceback.format_exc()
            print(trace)
            return jsonify({
                "error": str(e),
                "traceback": trace,
            }), 400

    @staticmethod
    def create():
        try:
            data = request.get_json()
            user_id = g.current_user_id

            return jsonify(
                MemoriaService.create(data, user_id)
            ), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def update(memoria_id):
        try:
            data = request.get_json()

            return jsonify(
                MemoriaService.update(memoria_id, data)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def delete(memoria_id):
        try:
            user_id = g.current_user_id

            return jsonify(
                MemoriaService.delete(memoria_id, user_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def change_status(memoria_id):
        try:
            data = request.get_json()
            user_id = g.current_user_id

            return jsonify(
                MemoriaService.change_status(memoria_id, data, user_id)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @staticmethod
    def reopen(memoria_id):
        try:
            data = request.get_json(silent=True) or {}
            user_id = g.current_user_id

            return jsonify(
                MemoriaService.reopen(memoria_id, user_id, data)
            ), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
