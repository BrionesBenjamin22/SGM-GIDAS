import { http } from "@/lib/http";

export interface TrabajoRevista {
  id: number;
  created_by: number | null;
  created_by_nombre?: string | null;
  created_at: string | null | undefined;
  deleted_by: number | null;
  deleted_by_nombre?: string | null;
  deleted_at: string | null | undefined;
  titulo_trabajo: string;
  nombre_revista: string;
  editorial: string;
  issn: string;
  pais: string;
  fecha: string;
  grupo: string | null;
  tipo_reunion?: {
    id: number;
    nombre: string;
  } | null;
  investigadores?: {
    id: number;
    nombre_apellido: string;
  }[];
}

export interface TrabajoRevistaPayload {
  titulo_trabajo: string;
  nombre_revista: string;
  editorial: string;
  issn: string;
  pais: string;
  fecha: string;
  tipo_reunion_id?: number | null;
  grupo_utn_id?: number | null;
}

type GetTrabajosRevistasOptions = {
  activos?: "true" | "false" | "all";
  orden?: "asc" | "desc";
};

export const getTrabajosRevistas = async (
  options: GetTrabajosRevistasOptions = {}
) => {
  const { activos, orden = "asc" } = options;

  const params = new URLSearchParams();

  if (activos) {
    params.append("activos", activos);
  }

  if (orden) {
    params.append("orden", orden);
  }

  const query = params.toString();
  const endpoint = query
    ? `/trabajos-revistas?${query}`
    : "/trabajos-revistas";

  return http<TrabajoRevista[]>(endpoint, {
    method: "GET",
  });
};

export const getTrabajoRevistaById = async (id: number) =>
  http<TrabajoRevista>(`/trabajos-revistas/${id}`, {
    method: "GET",
  });

export const createTrabajoRevista = async (data: TrabajoRevistaPayload) =>
  http<TrabajoRevista>("/trabajos-revistas/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateTrabajoRevista = async (
  id: number,
  data: Partial<TrabajoRevistaPayload>
) =>
  http<TrabajoRevista>(`/trabajos-revistas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteTrabajoRevista = async (id: number) =>
  http<{ message: string }>(`/trabajos-revistas/${id}`, {
    method: "DELETE",
  });

export const vincularInvestigadoresRevista = async (
  trabajoId: number,
  investigadoresIds: number[]
) =>
  http<{ message: string }>(`/trabajos-revistas/${trabajoId}/investigadores/`, {
    method: "POST",
    body: JSON.stringify({
      investigadores_ids: investigadoresIds,
    }),
  });

export const desvincularInvestigadoresRevista = async (
  trabajoId: number,
  investigadoresIds: number[]
) =>
  http<{ message: string }>(`/trabajos-revistas/${trabajoId}/investigadores/`, {
    method: "DELETE",
    body: JSON.stringify({
      investigadores_ids: investigadoresIds,
    }),
  });
