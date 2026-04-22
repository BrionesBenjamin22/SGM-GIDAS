import { useQuery } from "@tanstack/react-query";
import {
  getActividadesDocencia,
  type ActividadDocencia,
} from "@/services/actividadDocenciaServices";

export function useActividadDocencia(
  investigadorId?: number,
  activo: "true" | "false" | "all" = "true"
) {
  const { data = [], isLoading, isError } = useQuery<ActividadDocencia[]>({
    queryKey: ["docencia", investigadorId ?? "all", activo],
    queryFn: () => getActividadesDocencia(investigadorId, activo),
    staleTime: 60_000,
  });

  return { list: data, isLoading, isError };
}