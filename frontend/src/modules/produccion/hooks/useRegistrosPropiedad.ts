import { useQuery } from "@tanstack/react-query";
import {
  getRegistrosPropiedad,
  type RegistroPropiedad,
} from "@/modules/produccion/services/registrosPropiedadServices";

export function useRegistrosPropiedad(
  activos: "true" | "false" | "all" = "true",
  orden: "asc" | "desc" = "asc"
) {
  const { data, isLoading, isError } = useQuery<RegistroPropiedad[]>({
    queryKey: ["registros-propiedad", activos, orden],
    queryFn: () =>
      getRegistrosPropiedad({
        activos,
        orden,
      }),
    staleTime: 60_000,
  });

  return {
    list: data ?? [],
    isLoading,
    isError,
  };
}