import { useQuery } from "@tanstack/react-query";
import { getGradosAcademicos } from "@/modules/produccion/services/gradoAcademicoService";

export const useGradosAcademicos = () => {
  return useQuery({
    queryKey: ["grado-academico"],
    queryFn: getGradosAcademicos,
  });
};
