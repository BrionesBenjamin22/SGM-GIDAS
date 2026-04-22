import { http } from "@/lib/http";

export type Erogaciones = {
  id: number;
  created_by: number | null;
  created_by_nombre?: string | null;
  created_at: string | null | undefined;
  deleted_by: number | null;
  deleted_by_nombre?: string | null;
  deleted_at: string | null | undefined;
  egresos: number;
  ingresos: number;
  numero_erogacion: number;
  fecha: string;

  tipo_erogacion?: {
    id: number;
    nombre: string;
  };

  fuente?: {
    id: number;
    nombre: string;
  };

  grupo?: {
    id: number;
    nombre: string;
  };
};

export async function getErogaciones(
  activos: "true" | "false" | "all" = "true"
) {
  return http<Erogaciones[]>(`/erogaciones/?activos=${activos}`);
}

export async function getErogacionById(id: number) {
  return http<Erogaciones>(`/erogaciones/${id}`);
}

export type CreateErogacionPayload = {
  numeroErogacion: number;
  tipo_erogacion_id: number;
  ingresos: number;
  egresos: number;
  fuente_financiamiento_id?: number;
  grupo_utn_id: number;
};

export async function createErogacion(
  payload: CreateErogacionPayload
) {
  return http("/erogaciones/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateErogacion(id: number, payload: Partial<Erogaciones>) {
  return http<Erogaciones>(`/erogaciones/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteErogaciones(id: number) {
  return http<void>(`/erogaciones/${id}`, {
    method: "DELETE",
  });
}
