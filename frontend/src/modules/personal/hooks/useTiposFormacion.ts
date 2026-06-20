import { useQuery } from "@tanstack/react-query";
import { getTiposFormacion } from "@/modules/personal/services/tiposFormacionServices";

export function useTiposFormacion() {
  return useQuery({
    queryKey: ["tipos-formacion"],
    queryFn: getTiposFormacion,
    staleTime: Infinity,
  });
}
