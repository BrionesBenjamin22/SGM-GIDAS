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
  deleted_by: number | null;
  deleted_by_nombre?: string | null;
  deleted_at: string | null | undefined;
  titulo_trabajo: string;
  nombre_reunion: string;
  procedencia: string;
  fecha_inicio: string;
  tipo_reunion: TipoReunion;
  investigadores: InvestigadorResumen[];
  grupo_utn: string;
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

  return http<TrabajoReunion[]>(endpoint, {
    method: "GET",
  });
};

export const getTrabajoReunionById = async (
  id: number
): Promise<TrabajoReunion> => {
  return http<TrabajoReunion>(`/trabajos-reunion-cientifica/${id}`, {
    method: "GET",
  });
};

export const createTrabajoReunion = async (
  data: TrabajoReunionPayload
) => {
  return http<TrabajoReunion>("/trabajos-reunion-cientifica/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateTrabajoReunion = async (
  id: number,
  data: Partial<TrabajoReunionPayload>
) => {
  return http<TrabajoReunion>(`/trabajos-reunion-cientifica/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
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
