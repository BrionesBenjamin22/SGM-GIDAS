import { useQuery } from "@tanstack/react-query";
import {
  getFuentesFinanciamiento,
  type FuenteFinanciamiento,
} from "@/services/fuenteFinanciamientoService";

export function useFuentesFinanciamiento() {
  const { data = [], isLoading, isError } = useQuery<FuenteFinanciamiento[]>({
    queryKey: ["fuentes-financiamiento"],
    queryFn: getFuentesFinanciamiento,
    staleTime: 5 * 60_000,
  });

  return { fuentes: data, isLoading, isError };
}
