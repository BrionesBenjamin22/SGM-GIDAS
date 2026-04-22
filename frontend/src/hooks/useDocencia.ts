// hooks/useDocencia.ts
import { useQuery } from "@tanstack/react-query";
import { getDocencia, type Docencia } from "@/services/docenciaServices";

export function useDocencia(investigadorId?: string) {
  const { data = [], isLoading, isError, refetch } = useQuery<Docencia[]>({
    queryKey: ["docencia", investigadorId ?? "all"],
    queryFn: () => getDocencia(investigadorId ? { investigadorId } : undefined),
    staleTime: 60_000,
  });
  return { list: data, isLoading, isError, refetch };
}
