import { useQuery } from "@tanstack/react-query";
import { getTiposPersonal } from "@/services/tiposServices";

export function useTiposPersonal() {
  return useQuery({
    queryKey: ["tipo-personal"],
    queryFn: getTiposPersonal,
    staleTime: Infinity,
  });
}
