import { useQuery } from "@tanstack/react-query";
import { getGradosAcademicos } from "@/services/gradoAcademicoService";

export const useGradosAcademicos = () => {
  return useQuery({
    queryKey: ["grado-academico"],
    queryFn: getGradosAcademicos,
  });
};
