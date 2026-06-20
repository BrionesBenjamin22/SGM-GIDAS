import { useQuery } from "@tanstack/react-query";
import { getPersonal } from "@/modules/personal/services/personalServices";
import type { PersonalItem, PersonalType } from "@/modules/personal/services/personalServices";

export function usePersonal(
  tipo?: PersonalType,
  activo: "true" | "false" | "all" = "true"
) {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["personal", tipo, activo],
    queryFn: () => getPersonal(tipo, activo),
    staleTime: 60_000,
  });

  return { list: data, isLoading, isError };
}
