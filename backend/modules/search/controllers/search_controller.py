from math import ceil

from flask import current_app, jsonify, request

from modules.search.services.search_service import SearchService


class SearchController:

    @staticmethod
    def buscar():
        try:
            query_text = request.args.get("q", "").strip()
            orden = request.args.get("orden", "alf_asc")
            eliminados = request.args.get("eliminados", "false").strip().lower()
            page = SearchController._parse_positive_int("page", default=1)
            per_page = SearchController._parse_positive_int("per_page", default=9)
            per_page = min(per_page, current_app.config["SEARCH_MAX_PER_PAGE"])

            if not query_text:
                return jsonify({"error": 'El parametro "q" es obligatorio'}), 400

            if len(query_text) < 2:
                return jsonify({"error": "El texto debe tener al menos 2 caracteres"}), 400

            if len(query_text) > current_app.config["SEARCH_MAX_QUERY_LENGTH"]:
                return jsonify({
                    "error": (
                        "El texto de busqueda es demasiado largo. "
                        "Ingrese una consulta mas breve."
                    )
                }), 400

            if eliminados not in ("false", "true", "all"):
                return jsonify({
                    "error": 'El parametro "eliminados" debe ser "false", "true" o "all"'
                }), 400

            resultados = SearchService.search(
                query_text=query_text,
                orden=orden,
                eliminados=eliminados,
                max_scan_per_model=current_app.config["SEARCH_MAX_SCAN_PER_MODEL"],
            )
            total_resultados = len(resultados)
            total_pages = max(1, ceil(total_resultados / per_page))
            offset = (page - 1) * per_page
            paginated_results = resultados[offset:offset + per_page]

            return jsonify({
                "query": query_text,
                "orden": orden,
                "eliminados": eliminados,
                "total_resultados": total_resultados,
                "resultados": paginated_results,
                "meta": {
                    "page": page,
                    "per_page": per_page,
                    "total": total_resultados,
                    "total_pages": total_pages,
                },
            }), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        except Exception:
            return jsonify({
                "error": "Lo sentimos, no pudimos recuperar la informacion. Intente nuevamente."
            }), 500

    @staticmethod
    def _parse_positive_int(param_name: str, default: int) -> int:
        raw_value = request.args.get(param_name, str(default))

        try:
            value = int(raw_value)
        except ValueError as exc:
            raise ValueError(f'El parametro "{param_name}" debe ser numerico') from exc

        if value < 1:
            raise ValueError(f'El parametro "{param_name}" debe ser mayor o igual a 1')

        return value
