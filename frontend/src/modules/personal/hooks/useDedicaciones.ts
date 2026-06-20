import { useQuery } from "@tanstack/react-query";
import { getDedicaciones } from "@/modules/catalogos/services/tiposServices";

export function useDedicaciones() {
  return useQuery({
    queryKey: ["dedicaciones"],
    queryFn: getDedicaciones,
    staleTime: Infinity,
  });
}
