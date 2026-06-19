import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTiposProyecto,
  createTipoProyecto,
  type TipoProyecto,
} from "@/services/tiposProyectoServices";

/* =========================
   GET ALL
========================= */
export function useTiposProyecto() {
  return useQuery<TipoProyecto[]>({
    queryKey: ["tipos-proyecto"],
    queryFn: getTiposProyecto,
    staleTime: 60_000,
  });
}

/* =========================
   CREATE
========================= */
export function useCreateTipoProyecto() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (nombre: string) => createTipoProyecto(nombre),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tipos-proyecto"] });
    },
  });
}
