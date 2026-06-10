// hooks/useAuditoria.ts

type AuditData = {
  created_by?: number | string | null;
  deleted_by?: number | string | null;
  created_by_nombre?: string | null;
  deleted_by_nombre?: string | null;
};

export function useAuditoria(data?: AuditData | null) {
  return {
    nombreCreador: data?.created_by_nombre?.trim() || "—",
    nombreEliminador: data?.deleted_by_nombre?.trim() || "—",
  };
}