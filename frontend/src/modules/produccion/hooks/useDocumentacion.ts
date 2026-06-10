import { useQuery } from "@tanstack/react-query";
import {
  getDocumentacion,
  type Documentacion,
} from "@/services/documentacionServices";

export function useDocumentacion(
  activos: "true" | "false" | "all" = "true"
) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<Documentacion[]>({
    queryKey: ["documentacion", activos],
    queryFn: () => getDocumentacion(activos),
    staleTime: 60_000,
  });

  return {
    list: data ?? [],
    total: data?.length ?? 0,
    isLoading,
    isError,
    refetch,
  };
}