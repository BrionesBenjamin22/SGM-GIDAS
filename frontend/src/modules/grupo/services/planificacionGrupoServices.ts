import { http } from "@/lib/http";

interface PlanificacionGrupoBackend {
  id: number;
  descripcion: string;
  anio: number;
  grupo_id: number;
  grupo?: string | null;
  activo?: boolean;
  created_at?: string | null;
  deleted_at?: string | null;
  created_by?: number | string | null;
  created_by_nombre?: string | null;
  deleted_by?: number | string | null;
  deleted_by_nombre?: string | null;
  updated_at?: string | null;
  updated_by_nombre?: string | null;
}

export interface PlanificacionGrupo {
  id: number;
  descripcion: string;
  anio: number;
  grupo_id: number;
  grupo?: string | null;
  activo: boolean;
  created_at?: string | null;
  deletedAt?: string | null;
  created_by?: number | string | null;
  created_by_nombre?: string | null;
  deleted_by?: number | string | null;
  deleted_by_nombre?: string | null;
  updated_at?: string | null;
  updated_by_nombre?: string | null;
}

export interface PlanificacionGrupoPayload {
  descripcion: string;
  anio: number;
  grupo_id: number;
}

export interface HistorialPlanificacionItem {
  id: number;
  campo?: string;
  fecha_cambio?: string | null;
  usuario_nombre?: string | null;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
}

export interface PlanificacionesPage {
  data: PlanificacionGrupo[];
  meta: { page: number; per_page: number; total: number; total_pages: number };
}

function fromBackend(raw: PlanificacionGrupoBackend): PlanificacionGrupo {
  return {
    id: raw.id,
    descripcion: raw.descripcion,
    anio: raw.anio,
    grupo_id: raw.grupo_id,
    grupo: raw.grupo ?? null,
    activo: raw.activo ?? raw.deleted_at == null,
    created_at: raw.created_at ?? null,
    deletedAt: raw.deleted_at ?? null,
    created_by: raw.created_by ?? null,
    created_by_nombre: raw.created_by_nombre ?? null,
    deleted_by: raw.deleted_by ?? null,
    deleted_by_nombre: raw.deleted_by_nombre ?? null,
    updated_at: raw.updated_at ?? null,
    updated_by_nombre: raw.updated_by_nombre ?? null,
  };
}

// GET ALL
export const getPlanificaciones = async (
  activos: "true" | "false" | "all" = "true",
  page = 1,
  perPage = 9,
): Promise<PlanificacionesPage> => {
  const response = await http<{
    data: PlanificacionGrupoBackend[];
    meta: PlanificacionesPage["meta"];
  }>(
    `/planificaciones/?activos=${activos}&page=${page}&per_page=${perPage}`,
    {
      method: "GET",
    }
  );

  return { data: response.data.map(fromBackend), meta: response.meta };
};

// GET BY ID
export const getPlanificacionById = async (
  id: number
): Promise<PlanificacionGrupo> => {
  const raw = await http<PlanificacionGrupoBackend>(`/planificaciones/${id}`, {
    method: "GET",
  });

  return fromBackend(raw);
};

// CREATE
export const createPlanificacion = async (
  data: PlanificacionGrupoPayload
): Promise<PlanificacionGrupo> => {
  const raw = await http<PlanificacionGrupoBackend>("/planificaciones/", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return fromBackend(raw);
};

// UPDATE
export const updatePlanificacion = async (
  id: number,
  data: Partial<PlanificacionGrupoPayload>
): Promise<PlanificacionGrupo> => {
  const raw = await http<PlanificacionGrupoBackend>(`/planificaciones/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  return fromBackend(raw);
};

// DELETE
export const deletePlanificacion = async (id: number) => {
  return http(`/planificaciones/${id}`, {
    method: "DELETE",
  });
};

export const getHistorialPlanificacion = (id: number) =>
  http<HistorialPlanificacionItem[]>(`/planificaciones/${id}/historial`, {
    method: "GET",
  });
