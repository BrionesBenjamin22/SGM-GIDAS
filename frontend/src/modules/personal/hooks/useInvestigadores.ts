import { useQuery } from "@tanstack/react-query";
import {http} from "@/lib/http";

export interface Investigador {
  id: number;
  nombre_apellido: string;
}

export function useInvestigadores() {
  return useQuery({
    queryKey: ["investigadores"],
    queryFn: () =>
      http<Investigador[]>("/investigadores/", {
        method: "GET",
      }),
  });
}
