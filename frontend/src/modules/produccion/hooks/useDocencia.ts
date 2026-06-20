// hooks/useDocencia.ts
import { useQuery } from "@tanstack/react-query";
import {
  getActividadesDocencia,
  type ActividadDocencia,
} from "@/modules/produccion/services/actividadDocenciaServices";

export function useDocencia(investigadorId?: string) {
  const { data = [], isLoading, isError, refetch } = useQuery<ActividadDocencia[]>({
    queryKey: ["docencia", investigadorId ?? "all"],
    queryFn: () =>
      getActividadesDocencia(
        investigadorId ? Number(investigadorId) : undefined
      ),
    staleTime: 60_000,
  });
  return { list: data, isLoading, isError, refetch };
}
