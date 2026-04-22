from flask import jsonify, request, g, send_file
from core.services.grupo_service import (
    crear_grupo_utn,
    obtener_grupo_utn,
    actualizar_grupo_utn,
    eliminar_grupo_utn,
    restaurar_grupo_utn
)
from core.services.exportacion_service_impl import ExportService

class GrupoUtnController:

    @staticmethod
    def crear():
        try:
            data = request.get_json()
            user_id = g.current_user_id

            grupo = crear_grupo_utn(data, user_id)

            return jsonify(grupo.serialize()), 201

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    @staticmethod
    def obtener():
        try:
            grupo = obtener_grupo_utn()

            if not grupo:
                return jsonify({"error": "No se ha configurado un grupo."}), 404

            return jsonify(grupo.serialize()), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500


    @staticmethod
    def actualizar():
        try:
            data = request.get_json()
            grupo = actualizar_grupo_utn(data)

            return jsonify(grupo.serialize()), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    @staticmethod
    def eliminar():
        try:
            user_id = g.current_user_id

            result = eliminar_grupo_utn(user_id)

            return jsonify(result), 200

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
    @staticmethod
    def restaurar():
        try:
            grupo = restaurar_grupo_utn()
            return jsonify(grupo.serialize()), 200
        except ValueError as ve:
                return jsonify({"error": str(ve)}), 400
        except Exception as e:
                return jsonify({"error": str(e)}), 500
            
            
    @staticmethod
    def exportar_excel():
        archivo = ExportService.generar_excel_grupo(1)

        return send_file(
            archivo,
            as_attachment=True,
            download_name="reporte_GIDAS.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )