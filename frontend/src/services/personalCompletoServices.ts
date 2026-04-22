import { http } from "@/lib/http";

export interface HistorialHorasItem {
  id: number;
  horas_semanales: number;
  fecha_inicio: string;
  fecha_fin: string | null;
}

export interface PersonalCompleto {
  id: number;
  nombre_apellido: string;
  created_by: number | null;
  created_at: string | null | undefined;
  deleted_by: number | null;
  deleted_at: string | null | undefined;
  horas_semanales: number;
  historial_horas?: HistorialHorasItem[];
  activo: boolean;
  tipo_personal_id?: number;
  tipo_formacion_id?: number;
  rol: "personal" | "becario" | "investigador" | "profesional";
  grupo?: {
    id: number;
    nombre: string;
  } | null;
  relaciones?: any;
  [key: string]: any;
}

export const getPersonalCompletoByRolAndId = (
  rol: string,
  id: number
) => {
  return http<PersonalCompleto>(`/personal/${rol}/${id}`);
};

export function getPersonalCompletoById(id: number) {
  return http<PersonalCompleto>(`/personal-all/${id}`);
}