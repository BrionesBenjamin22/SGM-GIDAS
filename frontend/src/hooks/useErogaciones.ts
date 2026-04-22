import { useQuery } from "@tanstack/react-query";
import { getErogaciones, type Erogaciones } from "@/services/erogacionesServices";

export function useErogaciones(
  activos: "true" | "false" | "all" = "true"
) {
  const { data = [], isLoading, isError } = useQuery<Erogaciones[]>({
    queryKey: ["erogaciones", activos],
    queryFn: () => getErogaciones(activos),
    staleTime: 60_000,
  });

  return { list: data, isLoading, isError };
}