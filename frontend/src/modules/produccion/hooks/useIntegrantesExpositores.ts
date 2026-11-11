import { useQuery } from "@tanstack/react-query";
import { getIntegrantesExpositores } from "@/modules/produccion/services/trabajoExpositoresServices";

export function useIntegrantesExpositores(grupoId?: number) {
  return useQuery({ queryKey: ["integrantes-expositores", grupoId], queryFn: () => getIntegrantesExpositores(grupoId!), enabled: !!grupoId });
}
