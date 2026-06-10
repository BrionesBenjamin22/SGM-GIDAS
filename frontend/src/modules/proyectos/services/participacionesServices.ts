import { http } from "@/lib/http";

export interface Participacion {
  id: number;
  nombre_evento: string;
  forma_participacion: string;
  fecha: string;
  investigador_id: number;
  investigador?: string | null;
  created_at?: string | null;
  created_by?: number | null;
  created_by_nombre?: string | null;
  updated_at?: string | null;
  updated_by?: number | null;
  updated_by_nombre?: string | null;
  deleted_at?: string | null;
  deleted_by?: number | null;
  deleted_by_nombre?: string | null;
}

export interface HistorialParticipacionItem {
  id: number | string;
  campo?: string;
  fecha_cambio?: string | null;
  usuario_nombre?: string | null;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
  tipo?: string;
}

export interface ParticipacionPayload {
  nombre_evento: string;
  forma_participacion: string;
  fecha: string;
  investigador_id: number;
}

type GetParticipacionesOptions = {
  investigadorId?: number;
  orden?: "asc" | "desc";
  activos?: "true" | "false" | "all";
};

const normalizeParticipacion = (item: any): Participacion => ({
  id: item.id,
  nombre_evento: item.nombre_evento ?? "",
  forma_participacion: item.forma_participacion ?? "",
  fecha: item.fecha ?? "",
  investigador_id: item.investigador_id,
  investigador:
    typeof item.investigador === "string"
      ? item.investigador
      : item.investigador?.nombre_apellido ?? null,
  created_at: item.created_at ?? null,
  created_by: item.created_by ?? null,
  created_by_nombre: item.created_by_nombre ?? null,
  updated_at: item.updated_at ?? null,
  updated_by: item.updated_by ?? null,
  updated_by_nombre: item.updated_by_nombre ?? null,
  deleted_at: item.deleted_at ?? null,
  deleted_by: item.deleted_by ?? null,
  deleted_by_nombre: item.deleted_by_nombre ?? null,
});

export const getParticipaciones = async (
  options: GetParticipacionesOptions = {}
): Promise<Participacion[]> => {
  const { investigadorId, orden = "desc", activos } = options;
  const params = new URLSearchParams();

  if (typeof investigadorId === "number") {
    params.append("investigador_id", String(investigadorId));
  }

  if (orden) {
    params.append("orden", orden);
  }

  if (activos) {
    params.append("activos", activos);
  }

  const query = params.toString();
  const endpoint = query
    ? `/participaciones-relevantes?${query}`
    : "/participaciones-relevantes";

  const response = await http<any>(endpoint, {
    method: "GET",
  });

  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];

  return items.map(normalizeParticipacion);
};

export const getParticipacionById = async (
  id: number
): Promise<Participacion> => {
  const response = await http<any>(`/participaciones-relevantes/${id}`, {
    method: "GET",
  });

  return normalizeParticipacion(response);
};

export const getHistorialParticipacionById = async (
  id: number
): Promise<HistorialParticipacionItem[]> => {
  const response = await http<any>(`/participaciones-relevantes/${id}/historial`, {
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

export const crearParticipacion = async (
  payload: ParticipacionPayload
): Promise<Participacion> => {
  const response = await http<any>("/participaciones-relevantes/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeParticipacion(response);
};

export const actualizarParticipacion = async (
  id: number,
  payload: Partial<ParticipacionPayload>
): Promise<Participacion> => {
  const body: Record<string, unknown> = {};

  if ("nombre_evento" in payload) body.nombre_evento = payload.nombre_evento;
  if ("forma_participacion" in payload) {
    body.forma_participacion = payload.forma_participacion;
  }
  if ("fecha" in payload) body.fecha = payload.fecha;
  if ("investigador_id" in payload) body.investigador_id = payload.investigador_id;

  const response = await http<any>(`/participaciones-relevantes/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  return normalizeParticipacion(response);
};

export const eliminarParticipacion = async (
  id: number
): Promise<{ message: string }> => {
  return http<{ message: string }>(`/participaciones-relevantes/${id}`, {
    method: "DELETE",
  });
};
