import { useQuery } from "@tanstack/react-query";
import { getBecarios, Becario } from "@/modules/personal/services/becarioServices";

export function useBecarios() {
  return useQuery<Becario[]>({
    queryKey: ["becarios"],
    queryFn: getBecarios,
  });
}
