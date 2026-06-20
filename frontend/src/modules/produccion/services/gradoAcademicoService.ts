import { http } from "@/lib/http";

export interface GradoAcademico {
  id: number;
  nombre: string;
}

export const getGradosAcademicos = async (): Promise<GradoAcademico[]> => {
  return http<GradoAcademico[]>("/grado-academico", {
    method: "GET",
  });
};

export const getGradoAcademicoById = async (
  id: number
): Promise<GradoAcademico> => {
    return http<GradoAcademico>(`/grado-academico/${id}`, {
      method: "GET",
    });
}