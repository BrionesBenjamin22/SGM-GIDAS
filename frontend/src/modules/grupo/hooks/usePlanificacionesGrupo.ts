import { useQuery } from "@tanstack/react-query";
import { getPlanificaciones } from "@/modules/grupo/services/planificacionGrupoServices";

export function usePlanificaciones(
  activos: "true" | "false" | "all" = "true"
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["planificaciones", activos],
    queryFn: () => getPlanificaciones(activos),
  });

  return {
    list: data ?? [],
    isLoading,
    isError,
  };
}