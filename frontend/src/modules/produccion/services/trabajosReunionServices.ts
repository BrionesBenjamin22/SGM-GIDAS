import { http } from "@/lib/http";

export interface TipoReunion {
  id: number;
  nombre: string;
}

export interface InvestigadorResumen {
  id: number;
  nombre_apellido: string;
}

export interface TrabajoReunion {
  id: number;
  created_by: number | null;
  created_by_nombre?: string | null;
  created_at: string | null | undefined;
  updated_by?: number | null;
  updated_by_nombre?: string | null;
  updated_at?: string | null | undefined;
  deleted_by: number | null;
  deleted_by_nombre?: string | null;
  deleted_at: string | null | undefined;
  activo?: boolean;
  titulo_trabajo: string;
  nombre_reunion: string;
  procedencia: string;
  fecha_inicio: string;
  tipo_reunion: TipoReunion | null;
  investigadores: InvestigadorResumen[];
  grupo_utn: string | null;
}

export interface HistorialTrabajoReunionItem {
  id: number | string;
  campo?: string;
  fecha_cambio?: string | null;
  usuario_nombre?: string | null;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
  tipo?: string;
}

export interface TrabajoReunionPayload {
  titulo_trabajo: string;
  nombre_reunion: string;
  procedencia: string;
  fecha_inicio: string;
  tipo_reunion_id: number;
  grupo_utn_id: number;
}

type GetTrabajosReunionOptions = {
  activos?: "true" | "false" | "all";
  orden?: "asc" | "desc";
};

const normalizeTrabajoReunion = (item: any): TrabajoReunion => ({
  id: item.id,
  created_by: item.created_by ?? null,
  created_by_nombre: item.created_by_nombre ?? null,
  created_at: item.created_at ?? null,
  updated_by: item.updated_by ?? null,
  updated_by_nombre: item.updated_by_nombre ?? null,
  updated_at: item.updated_at ?? null,
  deleted_by: item.deleted_by ?? null,
  deleted_by_nombre: item.deleted_by_nombre ?? null,
  deleted_at: item.deleted_at ?? null,
  activo: item.activo ?? true,
  titulo_trabajo: item.titulo_trabajo ?? "",
  nombre_reunion: item.nombre_reunion ?? "",
  procedencia: item.procedencia ?? "",
  fecha_inicio: item.fecha_inicio ?? "",
  tipo_reunion: item.tipo_reunion ?? null,
  investigadores: Array.isArray(item.investigadores) ? item.investigadores : [],
  grupo_utn: item.grupo_utn ?? null,
});

export const getTrabajosReunion = async (
  options: GetTrabajosReunionOptions = {}
): Promise<TrabajoReunion[]> => {
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
    ? `/trabajos-reunion-cientifica?${query}`
    : "/trabajos-reunion-cientifica";

  const response = await http<any>(endpoint, {
    method: "GET",
  });

  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];

  return items.map(normalizeTrabajoReunion);
};

export const getTrabajoReunionById = async (
  id: number
): Promise<TrabajoReunion> => {
  const response = await http<any>(`/trabajos-reunion-cientifica/${id}`, {
    method: "GET",
  });

  return normalizeTrabajoReunion(response);
};

export const getHistorialTrabajoReunionById = async (
  id: number
): Promise<HistorialTrabajoReunionItem[]> => {
  const response = await http<any>(`/trabajos-reunion-cientifica/${id}/historial`, {
    method: "GET",
  });

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

export const createTrabajoReunion = async (data: TrabajoReunionPayload) => {
  const response = await http<any>("/trabajos-reunion-cientifica/", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return normalizeTrabajoReunion(response);
};

export const updateTrabajoReunion = async (
  id: number,
  data: Partial<TrabajoReunionPayload>
) => {
  const body: Record<string, unknown> = {};

  if ("titulo_trabajo" in data) body.titulo_trabajo = data.titulo_trabajo;
  if ("nombre_reunion" in data) body.nombre_reunion = data.nombre_reunion;
  if ("procedencia" in data) body.procedencia = data.procedencia;
  if ("fecha_inicio" in data) body.fecha_inicio = data.fecha_inicio;
  if ("tipo_reunion_id" in data) body.tipo_reunion_id = data.tipo_reunion_id;
  if ("grupo_utn_id" in data) body.grupo_utn_id = data.grupo_utn_id;

  const response = await http<any>(`/trabajos-reunion-cientifica/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  return normalizeTrabajoReunion(response);
};

export const deleteTrabajoReunion = async (id: number) => {
  return http<{ message: string }>(`/trabajos-reunion-cientifica/${id}`, {
    method: "DELETE",
  });
};

export const vincularInvestigadoresTrabajo = async (
  trabajoId: number,
  investigadoresIds: number[]
) => {
  return http<{ message: string }>(
    `/trabajos-reunion-cientifica/${trabajoId}/investigadores/`,
    {
      method: "POST",
      body: JSON.stringify({
        investigadores_ids: investigadoresIds,
      }),
    }
  );
};

export const desvincularInvestigadoresTrabajo = async (
  trabajoId: number,
  investigadoresIds: number[]
) => {
  return http<{ message: string }>(
    `/trabajos-reunion-cientifica/${trabajoId}/investigadores/`,
    {
      method: "DELETE",
      body: JSON.stringify({
        investigadores_ids: investigadoresIds,
      }),
    }
  );
};
