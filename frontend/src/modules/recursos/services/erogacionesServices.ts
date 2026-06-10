import { http } from "@/lib/http";

export type Erogacion = {
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
  egresos: number;
  ingresos: number;
  numero_erogacion: number;
  fecha: string;
  tipo_erogacion_id?: number | null;
  fuente_financiamiento_id?: number | null;
  grupo_utn_id: number;
  tipo_erogacion?: {
    id: number;
    nombre: string;
  } | null;
  fuente?: {
    id: number;
    nombre: string;
  } | null;
  grupo?: {
    id: number;
    nombre: string;
  } | null;
};

export type Erogaciones = Erogacion;

export type HistorialErogacionItem = {
  id: number | string;
  campo?: string;
  fecha_cambio?: string | null;
  usuario_nombre?: string | null;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
  tipo?: string;
};

export type CreateErogacionPayload = {
  numero_erogacion: number;
  tipo_erogacion_id: number;
  ingresos: number;
  egresos: number;
  fuente_financiamiento_id: number;
  grupo_utn_id: number;
  fecha?: string;
};

export type UpdateErogacionPayload = Partial<
  Pick<CreateErogacionPayload, "ingresos" | "egresos">
>;

const normalizeErogacion = (item: any): Erogacion => ({
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
  egresos: typeof item.egresos === "number" ? item.egresos : Number(item.egresos ?? 0),
  ingresos:
    typeof item.ingresos === "number" ? item.ingresos : Number(item.ingresos ?? 0),
  numero_erogacion:
    typeof item.numero_erogacion === "number"
      ? item.numero_erogacion
      : Number(item.numero_erogacion ?? 0),
  fecha: item.fecha ?? "",
  tipo_erogacion_id:
    item.tipo_erogacion_id ?? item.tipo_erogacion?.id ?? null,
  fuente_financiamiento_id:
    item.fuente_financiamiento_id ?? item.fuente?.id ?? null,
  grupo_utn_id: item.grupo_utn_id,
  tipo_erogacion: item.tipo_erogacion ?? null,
  fuente: item.fuente ?? null,
  grupo: item.grupo ?? null,
});

export async function getErogaciones(
  activos: "true" | "false" | "all" = "true"
): Promise<Erogacion[]> {
  const response = await http<any>(`/erogaciones/?activos=${activos}`);
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];

  return items.map(normalizeErogacion);
}

export async function getErogacionById(id: number): Promise<Erogacion> {
  const response = await http<any>(`/erogaciones/${id}`);
  return normalizeErogacion(response);
}

export async function getHistorialErogacionById(
  id: number
): Promise<HistorialErogacionItem[]> {
  const response = await http<any>(`/erogaciones/${id}/historial`, {
    method: "GET",
  });

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

export async function createErogacion(
  payload: CreateErogacionPayload
): Promise<Erogacion> {
  const response = await http<any>("/erogaciones/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeErogacion(response);
}

export async function updateErogacion(
  id: number,
  payload: UpdateErogacionPayload
): Promise<Erogacion> {
  const body: Record<string, unknown> = {};

  if ("ingresos" in payload) body.ingresos = payload.ingresos;
  if ("egresos" in payload) body.egresos = payload.egresos;

  const response = await http<any>(`/erogaciones/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  return normalizeErogacion(response);
}

export async function deleteErogaciones(
  id: number
): Promise<{ message: string }> {
  return http<{ message: string }>(`/erogaciones/${id}`, {
    method: "DELETE",
  });
}
