import { useQuery } from "@tanstack/react-query";
import { getBecarios, Becario } from "@/services/becarioServices";

export function useBecarios() {
  return useQuery<Becario[]>({
    queryKey: ["becarios"],
    queryFn: getBecarios,
  });
}
