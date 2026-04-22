import { http } from "@/lib/http";

export type Equipamiento = {
  id: number;
  denominacion: string;
  created_by: number | null;
  created_by_nombre?: string | null;
  created_at: string | null | undefined;
  deleted_by: number | null;
  deleted_by_nombre?: string | null;
  deleted_at: string | null | undefined;
  descripcion_breve: string;
  fecha_incorporacion: string;
  monto_invertido: number;
  grupo_utn_id: number;
};

export async function getEquipamiento(
  activos: "true" | "false" | "all" = "true"
) {
  return http<Equipamiento[]>(`/equipamiento/?activos=${activos}`);
}

export async function getEquipamientoById(id: number) {
  return http<Equipamiento>(`/equipamiento/${id}`);
}

export async function createEquipamiento(payload: {
  denominacion: string;
  descripcion_breve: string;
  fecha_incorporacion: string;
  monto_invertido: number;
  grupo_utn_id: number;
}) {
  return http("/equipamiento/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEquipamiento(
  id: number,
  payload: Partial<Omit<Equipamiento, "id">>
) {
  return http<Equipamiento>(`/equipamiento/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteEquipamiento(id: number) {
  return http<void>(`/equipamiento/${id}`, {
    method: "DELETE",
  });
}
