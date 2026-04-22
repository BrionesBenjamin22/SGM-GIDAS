import { useMutation } from "@tanstack/react-query";
import { exportarExcelGrupo } from "@/services/uctServices";

export function useExportarExcelGrupo() {
  return useMutation({
    mutationKey: ["exportar-excel-grupo"],
    mutationFn: exportarExcelGrupo,
  });
}