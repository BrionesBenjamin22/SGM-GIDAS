import { useQuery } from "@tanstack/react-query";
import { getPlanificaciones } from "@/modules/grupo/services/planificacionGrupoServices";

export function usePlanificaciones(
  activos: "true" | "false" | "all" = "true",
  page = 1,
) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["planificaciones", activos, page],
    queryFn: () => getPlanificaciones(activos, page, 9),
  });

  return {
    list: data?.data ?? [],
    meta: data?.meta ?? { page: 1, per_page: 9, total: 0, total_pages: 1 },
    isLoading,
    isError,
  };
}
