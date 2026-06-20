import { http } from "@/lib/http";

export interface RolActividad {
  id: number;
  nombre: string;
}

export const getRolesActividadDocencia = async (): Promise<RolActividad[]> => {
  return http<RolActividad[]>("/rol-actividad", {
    method: "GET",
  });
};

export const getRolActividadById = async (
  id: number
): Promise<RolActividad> => {
  return http<RolActividad>(`/rol-actividad/${id}`, {
    method: "GET",
  });
};
