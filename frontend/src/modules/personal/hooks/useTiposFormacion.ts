import { useQuery } from "@tanstack/react-query";
import { getTiposFormacion } from "@/services/tiposFormacionServices";

export function useTiposFormacion() {
  return useQuery({
    queryKey: ["tipos-formacion"],
    queryFn: getTiposFormacion,
    staleTime: Infinity,
  });
}
