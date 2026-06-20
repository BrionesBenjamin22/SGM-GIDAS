import { useQuery } from "@tanstack/react-query";
import {
  getDashboardResumen,
  type DashboardResumenParams,
} from "@/modules/dashboard/services/dashboardGeneralService";

export function useDashboardResumen(params?: DashboardResumenParams) {
  return useQuery({
    queryKey: ["dashboard-resumen", params],
    queryFn: () => getDashboardResumen(params),
    staleTime: 60_000,
  });
}