import { useQuery } from "@tanstack/react-query";
import {
  getArticulosDivulgacion,
  deleteArticulo,
  type ArticuloDivulgacion,
} from "@/services/articulosDivulgacionServices";
import { useUct } from "@/hooks/useUct";

export function useArticulosDivulgacion(
  activos: "true" | "false" | "all" = "true"
) {
  const { uct } = useUct();

  const { data = [], isLoading, isError } = useQuery<ArticuloDivulgacion[]>({
    queryKey: ["articulos-divulgacion", activos],
    queryFn: () =>
      getArticulosDivulgacion({
        grupo_utn_id: uct?.id,
        activos,
      }),
    enabled: !!uct,
    staleTime: 60_000,
  });

  const remove = async (id: number) => {
    return deleteArticulo(id);
  };

  return {
    list: data,
    isLoading,
    isError,
    remove,
  };
}