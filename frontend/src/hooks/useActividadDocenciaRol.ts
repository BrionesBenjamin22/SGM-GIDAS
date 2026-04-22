import { useQuery } from "@tanstack/react-query";
import { getRolesActividadDocencia } from "@/services/rolActividadService";

export const useRolesActividadDocencia = () => {
  return useQuery({
    queryKey: ["rol-actividad"],
    queryFn: getRolesActividadDocencia,
  });
};
