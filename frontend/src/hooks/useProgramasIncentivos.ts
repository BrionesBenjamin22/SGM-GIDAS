import { useQuery } from "@tanstack/react-query";
import { getProgramasIncentivos } from "@/services/programaIncentivosServices";

export function useProgramasIncentivos() {
  return useQuery({
    queryKey: ["programas-incentivos"],
    queryFn: getProgramasIncentivos,
    staleTime: Infinity,
  });
}
