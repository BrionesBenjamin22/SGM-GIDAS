// src/hooks/useCargos.ts
import { useQuery } from "@tanstack/react-query";
import { getCargos } from "@/modules/grupo/services/cargoServices";

export function useCargos() {
  return useQuery({
    queryKey: ["cargos"],
    queryFn: getCargos,
  });
}