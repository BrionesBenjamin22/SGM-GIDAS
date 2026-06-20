import { useQuery } from "@tanstack/react-query";
import { getProgramasIncentivos } from "@/modules/grupo/services/programaIncentivosServices";

export function useProgramasIncentivos() {
  return useQuery({
    queryKey: ["programas-incentivos"],
    queryFn: getProgramasIncentivos,
    staleTime: Infinity,
  });
}
