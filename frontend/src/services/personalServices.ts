import { http } from "@/lib/http";

export type PersonalType =
  | "PTAA"
  | "PROFESIONAL"
  | "BECARIO"
  | "INVESTIGADOR";

export interface PersonalItem {
  id: number;
  nombre_apellido: string;
  horas_semanales: number;
  tipo: "PTAA" | "PROFESIONAL" | "BECARIO" | "INVESTIGADOR";
  activo: boolean;
  rol: string;
  grupo?: {
    id: number;
    nombre: string;
  } | null;
}
export interface PersonalPayload {
  nombre_apellido: string;
  horas_semanales: number;
  fecha_alta_grupo: string;
  grupo_utn_id: number;
  tipo_personal_id: number;
  activo: boolean;
}


export function getPersonal(
  tipo?: PersonalType,
  activos: "true" | "false" | "all" = "true"
) {
  const params = new URLSearchParams();

  if (tipo) params.append("tipo", tipo);
  if (activos) params.append("activos", activos);

  const query = params.toString();

  return http<PersonalItem[]>(`/personal-all${query ? `?${query}` : ""}`);
}

// 👉 POST / PUT PTAA + Profesional
export function upsertPersonal(payload: PersonalPayload) {
  return http("/personal/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function actualizarPersonal(id: number, payload: any, rol: string) {
  return http(`/personal/${rol}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function eliminarPersonal(id: number, rol: string) {
  return http(`/personal/${rol}/${id}`, {
    method: "DELETE",
  });
}

