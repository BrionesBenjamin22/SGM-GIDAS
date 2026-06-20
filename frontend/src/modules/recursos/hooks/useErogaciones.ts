import { useQuery } from "@tanstack/react-query";
import { getErogaciones, type Erogacion } from "@/modules/recursos/services/erogacionesServices";

export function useErogaciones(
  activos: "true" | "false" | "all" = "true"
) {
  const { data = [], isLoading, isError } = useQuery<Erogacion[]>({
    queryKey: ["erogaciones", activos],
    queryFn: () => getErogaciones(activos),
    staleTime: 60_000,
  });

  return { list: data, isLoading, isError };
}
