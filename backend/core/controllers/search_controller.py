from flask import jsonify, request
from core.services.search_service import SearchService


class SearchController:

    @staticmethod
    def buscar():
        """
        Endpoint principal de búsqueda estilo Google.

        Query params:
            - q: texto a buscar (requerido)
            - orden: tipo de ordenamiento (opcional)
                valores posibles:
                    alf_asc
                    alf_desc
                    fecha_asc
                    fecha_desc
            - eliminados: filtro de eliminados logicos (opcional)
                valores posibles:
                    false
                    true
                    all
        """

        try:
            query_text = request.args.get("q", "").strip()
            orden = request.args.get("orden", "alf_asc")
            eliminados = request.args.get("eliminados", "false").strip().lower()

            if not query_text:
                return jsonify({
                    "error": 'El parámetro "q" es obligatorio'
                }), 400

            if len(query_text) < 2:
                return jsonify({
                    "error": "El texto debe tener al menos 2 caracteres"
                }), 400

            if eliminados not in ("false", "true", "all"):
                return jsonify({
                    "error": (
                        'El parámetro "eliminados" debe ser '
                        '"false", "true" o "all"'
                    )
                }), 400

            resultados = SearchService.search(
                query_text=query_text,
                orden=orden,
                eliminados=eliminados
            )

            return jsonify({
                "query": query_text,
                "orden": orden,
                "eliminados": eliminados,
                "total_resultados": len(resultados),
                "resultados": resultados
            }), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        except Exception as e:
            return jsonify({
                "error": f"Error interno del servidor: {str(e)}"
            }), 500
