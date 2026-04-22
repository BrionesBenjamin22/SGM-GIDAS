import { http } from "@/lib/http";

export interface RegistroPropiedad {
  id: number;
  grupo_utn_id: number;
  created_by: number | null;
  created_by_nombre?: string | null;
  created_at: string | null | undefined;
  deleted_by: number | null;
  deleted_by_nombre?: string | null;
  deleted_at: string | null | undefined;

  nombre_articulo: string;
  organismo_registrante: string;
  fecha_registro: string;

  tipo_registro_id: number | null;
  tipo_registro: string;
  grupo: string;
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
  return http<RegistroPropiedad>(`/registros-propiedad/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteRegistroPropiedad(id: number) {
  return http<{ message: string }>(`/registros-propiedad/${id}`, {
    method: "DELETE",
  });
}
