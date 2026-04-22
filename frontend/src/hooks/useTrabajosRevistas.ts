import { useQuery } from "@tanstack/react-query";
import {
  getTrabajosRevistas,
  type TrabajoRevista,
} from "@/services/trabajosRevistasServices";

export function useTrabajosRevistas(
  activos: "true" | "false" | "all" = "true",
  orden: "asc" | "desc" = "asc"
) {
  const { data, isLoading, isError } = useQuery<TrabajoRevista[]>({
    queryKey: ["trabajos-revistas", activos, orden],
    queryFn: () =>
      getTrabajosRevistas({
        activos,
        orden,
      }),
    staleTime: 60_000,
  });

  return {
    list: data ?? [],
    isLoading,
    isError,
  };
}