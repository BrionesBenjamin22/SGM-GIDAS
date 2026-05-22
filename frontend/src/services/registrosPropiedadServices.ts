import { http } from "@/lib/http";

export interface RegistroPropiedad {
  id: number;
  grupo_utn_id: number;
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
  nombre_articulo: string;
  organismo_registrante: string;
  fecha_registro: string;
  tipo_registro_id: number | null;
  tipo_registro: string;
  grupo: string;
}

export interface HistorialRegistroPropiedadItem {
  id: number | string;
  campo?: string;
  fecha_cambio?: string | null;
  usuario_nombre?: string | null;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
  tipo?: string;
}

export interface RegistroPropiedadPayload {
  nombre_articulo: string;
  organismo_registrante: string;
  fecha_registro: string;
  tipo_registro_id: number;
  grupo_utn_id: number;
}

type GetRegistrosPropiedadOptions = {
  activos?: "true" | "false" | "all";
  orden?: "asc" | "desc";
};

export async function getRegistrosPropiedad(
  options: GetRegistrosPropiedadOptions = {}
): Promise<RegistroPropiedad[]> {
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
    ? `/registros-propiedad?${query}`
    : "/registros-propiedad";

  return http<RegistroPropiedad[]>(endpoint, {
    method: "GET",
  });
}

export async function getRegistroPropiedadById(
  id: number
): Promise<RegistroPropiedad> {
  return http<RegistroPropiedad>(`/registros-propiedad/${id}`, {
    method: "GET",
  });
}

export async function getHistorialRegistroPropiedadById(
  id: number
): Promise<HistorialRegistroPropiedadItem[]> {
  const data = await http<
    HistorialRegistroPropiedadItem[] | { data?: HistorialRegistroPropiedadItem[] }
  >(`/registros-propiedad/${id}/historial`, {
    method: "GET",
  });

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

export async function createRegistroPropiedad(
  payload: RegistroPropiedadPayload
) {
  return http<RegistroPropiedad>("/registros-propiedad/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRegistroPropiedad(
  id: number,
  payload: Partial<RegistroPropiedadPayload>
) {
  const body: Record<string, unknown> = {};

  if ("nombre_articulo" in payload) {
    body.nombre_articulo = payload.nombre_articulo;
  }

  if ("organismo_registrante" in payload) {
    body.organismo_registrante = payload.organismo_registrante;
  }

  if ("fecha_registro" in payload) {
    body.fecha_registro = payload.fecha_registro;
  }

  if ("tipo_registro_id" in payload) {
    body.tipo_registro_id = payload.tipo_registro_id;
  }

  if ("grupo_utn_id" in payload) {
    body.grupo_utn_id = payload.grupo_utn_id;
  }

  return http<RegistroPropiedad>(`/registros-propiedad/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteRegistroPropiedad(id: number) {
  return http<{ message: string }>(`/registros-propiedad/${id}`, {
    method: "DELETE",
  });
}
