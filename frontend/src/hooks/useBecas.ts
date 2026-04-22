import { useQuery } from "@tanstack/react-query";
import { getBecas } from "@/services/becasService";

export function useBecas() {
    return useQuery({
        queryKey: ["becas"],
        queryFn: getBecas,
        staleTime: 5 * 60 * 1000,
    });
}