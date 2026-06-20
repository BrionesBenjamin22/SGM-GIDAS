import { useQuery } from "@tanstack/react-query";
import {
  getTiposErogacion,
  type TipoErogacion,
} from "@/modules/recursos/services/tipoErogacionService";

export function useTiposErogacion() {
  const { data = [], isLoading, isError } = useQuery<TipoErogacion[]>({
    queryKey: ["tipo-erogacion"],
    queryFn: getTiposErogacion,
    staleTime: 5 * 60_000,
  });

  return { tipos: data, isLoading, isError };
}
