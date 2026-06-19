import { useQuery } from "@tanstack/react-query";
import { getTiposReunion } from "@/services/tipoReunionServices";

export function useTiposReunion() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tipos-reunion-cientifica"],
    queryFn: getTiposReunion,
  });

  return {
    tipos: data ?? [],
    isLoading,
    isError,
  };
}