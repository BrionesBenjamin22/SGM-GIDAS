// hooks/useUsuario.ts
import { useQuery } from "@tanstack/react-query";
import { getUsuarioId } from "@/modules/auth/services/usuariosService";
import type { Usuario } from "@/modules/auth/services/usuariosService";

export function useUsuario(id?: number) {
  return useQuery<Usuario>({
    queryKey: ["usuario", id],
    queryFn: () => getUsuarioId(id as number),
    enabled: id !== undefined && !isNaN(id),
  });
}