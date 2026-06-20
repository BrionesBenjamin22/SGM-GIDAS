import { useQuery } from "@tanstack/react-query";
import {
  getPlanificaciones,
  type Planificacion,
} from "@/modules/grupo/services/planificacionesServices";

export function usePlanificaciones() {
  return useQuery<Planificacion[]>({
    queryKey: ["planificaciones"],
    queryFn: getPlanificaciones,
    staleTime: 60_000,
  });
}
