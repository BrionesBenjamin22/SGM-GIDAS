// src/hooks/useCargos.ts
import { useQuery } from "@tanstack/react-query";
import { getCargos } from "@/services/cargoServices";

export function useCargos() {
  return useQuery({
    queryKey: ["cargos"],
    queryFn: getCargos,
  });
}