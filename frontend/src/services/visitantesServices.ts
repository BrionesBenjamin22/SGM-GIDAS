import { http } from "@/lib/http";

export type Visitante = {
  id: number;
  created_by: number | null;
  created_by_nombre?: string | null;
  created_at: string | null | undefined;
  deleted_by: number | null;
  deleted_by_nombre?: string | null;
  deleted_at: string | null | undefined;
  razon: string;
  fecha: string;
  procedencia: string;
  tipo_visita_id: number;
  grupo_utn_id: number;

  tipo_visita?: {
    id: number;
    nombre: string;
  };

  grupo?: string;
};

export type VisitantePayload = {
  razon: string;
  fecha: string;
  procedencia: string;
  tipo_visita_id: number;
  grupo_utn_id: number;
};

export type GrupoUtnOption = {
  id: number;
  nombre: string;
};

export type TipoVisitaOption = {
  id: number;
  nombre: string;
};

export async function getVisitantes(
  activos: "true" | "false" | "all" = "true"
) {
  return http<Visitante[]>(`/visitas-academicas/?activos=${activos}`);
}

export async function getVisitanteById(id: number) {
  return http<Visitante>(`/visitas-academicas/${id}`);
}

export async function crearVisitante(payload: VisitantePayload) {
  return http<Visitante>("/visitas-academicas/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function actualizarVisitante(
  id: number,
  payload: Partial<VisitantePayload>
) {
  return http<Visitante>(`/visitas-academicas/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function eliminarVisitante(id: number) {
  return http<void>(`/visitas-academicas/${id}`, {
    method: "DELETE",
  });
}

export async function getGruposUtn() {
  const data = await http<any[]>("/grupo-utn/");

  return (data ?? []).map((g) => ({
    id: g.id,
    nombre: g.nombre_sigla_grupo || g.nombre,
  })) as GrupoUtnOption[];
}

export async function getTiposVisita() {
  const data = await http<any[]>("/tipos-reunion-cientifica/");

  return (data ?? []).map((t) => ({
    id: t.id,
    nombre: t.nombre,
  })) as TipoVisitaOption[];
}
