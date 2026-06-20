import { http } from "@/lib/http";

/* ───────────────────────────────────────────
   Tipos que devuelve el BACKEND
   GET /search?q=...&orden=...&eliminados=...
   ─────────────────────────────────────────── */

export type Orden = "alf_asc" | "alf_desc" | "fecha_asc" | "fecha_desc";
export type EstadoBusqueda = "activos" | "eliminados" | "all";

/** Cada resultado que devuelve la API */
export type BackendResult = {
  tipo: string;
  id: number;
  titulo: string;
  subtitulo?: string | null;
  fecha?: string | null;
  url: string;
  extra?: Record<string, unknown>;
  activo?: boolean;
};

/** Wrapper de la respuesta completa */
type SearchResponse = {
  query: string;
  orden: Orden;
  total_resultados: number;
  resultados: BackendResult[];
};

/* ───────────────────────────────────────────
   Tipo normalizado que usa la UI
   ─────────────────────────────────────────── */
export type SearchResult = {
  id: number;
  tipo: string;
  titulo: string;
  subtitulo: string;
  fecha: string | null;
  href: string;
  extra?: Record<string, unknown>;
  activo: boolean | null;
};

/* ───────────────────────────────────────────
   Mapeo de URLs backend → frontend
   ─────────────────────────────────────────── */
const URL_MAP: [RegExp, string][] = [
  [/^\/personal\/(\d+)$/, "/personal/personal/$1"],
  [/^\/investigadores\/(\d+)$/, "/investigadores/$1"],
  [/^\/becarios\/(\d+)$/, "/becarios/$1"],
  [/^\/actividades-docencia\/(\d+)$/, "/docenciaInvestigador/$1"],
  [/^\/documentacion-bibliografica\/(\d+)$/, "/documentacion/$1"],
  [/^\/participaciones-relevantes\/(\d+)$/, "/participaciones/$1"],
  [/^\/articulos-divulgacion\/(\d+)$/, "/articulos-divulgacion/$1"],
  [/^\/visitas-academicas\/(\d+)$/, "/visitantes/$1"],
  [/^\/proyectos\/(\d+)$/, "/proyectos/$1"],
  [/^\/transferencias\/(\d+)$/, "/transferencias/$1"],
  [/^\/distinciones\/(\d+)$/, "/distinciones/$1"],
  [/^\/equipamiento\/(\d+)$/, "/equipamiento/$1"],
  [/^\/erogaciones\/(\d+)$/, "/erogaciones/$1"],
  [/^\/registros-propiedad\/(\d+)$/, "/registros-propiedad/$1"],
  [/^\/trabajos-reunion-cientifica\/(\d+)$/, "/trabajos-reunion/$1"],
  [/^\/trabajos-revistas\/(\d+)$/, "/trabajos-revistas/$1"],
  [/^\/planificaciones\/(\d+)$/, "/planificaciones/$1"],

  [/^\/tipos-proyecto\/.+$/, "/proyectos"],
  [/^\/tipos-erogacion\/.+$/, "/erogaciones"],
  [/^\/tipos-registro\/.+$/, "/registros-propiedad"],
  [/^\/tipos-contrato\/.+$/, "/transferencias"],
  [/^\/tipos-personal\/.+$/, "/personal"],
  [/^\/fuente-financiamiento\/.+$/, "/proyectos"],
  [/^\/fuentes-financiamiento\/.+$/, "/proyectos"],
  [/^\/autores\/.+$/, "/documentacion"],
  [/^\/directivos\/.+$/, "/personal"],
];

export function resolveFrontendUrl(backendUrl: string): string {
  for (const [re, replacement] of URL_MAP) {
    if (re.test(backendUrl)) {
      return backendUrl.replace(re, replacement);
    }
  }
  return backendUrl;
}

function mapEstadoToQueryValue(estado: EstadoBusqueda): string | null {
  if (estado === "activos") return null;
  if (estado === "eliminados") return "true";
  return "all";
}

/* ───────────────────────────────────────────
   Función principal
   ─────────────────────────────────────────── */
export async function searchAll(
  q: string,
  orden: Orden = "alf_asc",
  estado: EstadoBusqueda = "activos",
): Promise<SearchResult[]> {
  if (q.trim().length < 2) return [];

  const params = new URLSearchParams({ q, orden });

  const eliminados = mapEstadoToQueryValue(estado);
  if (eliminados !== null) {
    params.set("eliminados", eliminados);
  }

  const data = await http<SearchResponse>(`/search/?${params.toString()}`);

  if (!data?.resultados) return [];

  return data.resultados.map((r) => ({
    id: r.id,
    tipo: r.tipo,
    titulo: r.titulo,
    subtitulo: r.subtitulo ?? "",
    fecha: r.fecha ? String(r.fecha) : null,
    href: resolveFrontendUrl(r.url),
    extra: r.extra,
    activo: typeof r.activo === "boolean" ? r.activo : null,
  }));
}
