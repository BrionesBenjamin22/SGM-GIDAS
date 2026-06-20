import { useQuery } from "@tanstack/react-query";
import { getRolesActividadDocencia } from "@/modules/produccion/services/rolActividadService";

export const useRolesActividadDocencia = () => {
  return useQuery({
    queryKey: ["rol-actividad"],
    queryFn: getRolesActividadDocencia,
  });
};
