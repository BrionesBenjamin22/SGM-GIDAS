import { useQuery } from "@tanstack/react-query";
import { getTiposRegistroPropiedad } from "@/services/tipoRegistroPropiedadServices";

export function useTiposRegistroPropiedad() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tipo-registro-propiedad"],
    queryFn: getTiposRegistroPropiedad,
  });

  return {
    tipos: data ?? [],
    isLoading,
    isError,
  };
}
