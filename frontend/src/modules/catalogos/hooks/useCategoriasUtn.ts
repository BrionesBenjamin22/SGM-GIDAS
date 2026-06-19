import { useQuery } from "@tanstack/react-query";
import { getCategoriasUtn } from "@/services/categoriaUtnServices";

export function useCategoriasUtn() {
  return useQuery({
    queryKey: ["categorias-utn"],
    queryFn: getCategoriasUtn,
    staleTime: Infinity,
  });
}
