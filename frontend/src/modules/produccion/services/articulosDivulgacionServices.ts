import { http } from "@/lib/http";

export interface ArticuloDivulgacion {
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
  titulo: string;
  descripcion: string;
  fecha_publicacion: string;
  grupo_utn_id: number;
  grupo_utn?: {
    id: number;
    nombre: string;
  };
}

export interface HistorialArticuloDivulgacionItem {
  id: number | string;
  campo?: string;
  fecha_cambio?: string | null;
  usuario_nombre?: string | null;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
  tipo?: string;
}

export interface ArticuloPayload {
  titulo: string;
  descripcion: string;
  fecha_publicacion: string;
  grupo_utn_id: number;
}

type GetArticulosParams = {
  grupo_utn_id?: number;
  activos?: "true" | "false" | "all";
};

const normalizeArticulo = (item: any): ArticuloDivulgacion => ({
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
  titulo: item.titulo ?? "",
  descripcion: item.descripcion ?? "",
  fecha_publicacion: item.fecha_publicacion ?? "",
  grupo_utn_id: item.grupo_utn_id ?? item.grupo_utn?.id,
  grupo_utn: item.grupo_utn ?? undefined,
});

export const getArticulosDivulgacion = async (
  params?: GetArticulosParams
): Promise<ArticuloDivulgacion[]> => {
  const searchParams = new URLSearchParams();

  if (params?.grupo_utn_id) {
    searchParams.append("grupo_utn_id", String(params.grupo_utn_id));
  }

  if (params?.activos) {
    searchParams.append("activos", params.activos);
  }

  const query = searchParams.toString();
  const url = query
    ? `/articulos-divulgacion/?${query}`
    : "/articulos-divulgacion/";

  const response = await http<any>(url, {
    method: "GET",
  });

  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];

  return items.map(normalizeArticulo);
};

export const getArticuloById = async (
  id: number
): Promise<ArticuloDivulgacion> => {
  const response = await http<any>(`/articulos-divulgacion/${id}`, {
    method: "GET",
  });

  return normalizeArticulo(response);
};

export const getHistorialArticuloById = async (
  id: number
): Promise<HistorialArticuloDivulgacionItem[]> => {
  const response = await http<any>(`/articulos-divulgacion/${id}/historial`, {
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

export const createArticulo = async (
  payload: ArticuloPayload
): Promise<ArticuloDivulgacion> => {
  const response = await http<any>("/articulos-divulgacion/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeArticulo(response);
};

export const updateArticulo = async (
  id: number,
  payload: Partial<ArticuloPayload>
): Promise<ArticuloDivulgacion> => {
  const body: Record<string, unknown> = {};

  if ("titulo" in payload) body.titulo = payload.titulo;
  if ("descripcion" in payload) body.descripcion = payload.descripcion;
  if ("fecha_publicacion" in payload) body.fecha_publicacion = payload.fecha_publicacion;
  if ("grupo_utn_id" in payload) body.grupo_utn_id = payload.grupo_utn_id;

  const response = await http<any>(`/articulos-divulgacion/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  return normalizeArticulo(response);
};

export const deleteArticulo = async (id: number) => {
  return http(`/articulos-divulgacion/${id}`, {
    method: "DELETE",
  });
};
