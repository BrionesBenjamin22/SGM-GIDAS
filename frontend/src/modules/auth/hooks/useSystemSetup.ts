import { useQuery } from "@tanstack/react-query";
import { esPrimerUsuario } from "@/services/authService";

export const SYSTEM_SETUP_QUERY_KEY = ["system-setup"] as const;

export function useSystemSetup() {
  return useQuery({
    queryKey: SYSTEM_SETUP_QUERY_KEY,
    queryFn: esPrimerUsuario,
    retry: false,
  });
}
