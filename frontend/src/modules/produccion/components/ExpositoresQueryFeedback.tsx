import type { UseQueryResult } from "@tanstack/react-query";
import Button from "@/components/Button";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import type { Expositor } from "@/modules/produccion/services/trabajoExpositoresServices";

type Props = {
  query: Pick<UseQueryResult<Expositor[]>, "data" | "isError" | "isFetching" | "refetch">;
};

export default function ExpositoresQueryFeedback({ query }: Props) {
  if (query.isError) {
    return (
      <div className="space-y-2">
        <p role="alert" className="text-sm text-red-600">
          Lo sentimos, no pudimos recuperar los integrantes expositores. Intente nuevamente.
        </p>
        <Button type="button" variant="secondary" size="sm"
          loading={query.isFetching} loadingText="Cargando integrantes expositores..."
          onClick={() => { void query.refetch(); }}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (query.data === undefined) {
    return <LoadingSkeleton variant="compact" label="Cargando integrantes expositores…" />;
  }

  if (query.data.length === 0) {
    return <p role="status" className="text-sm text-slate-500">No hay integrantes expositores activos disponibles.</p>;
  }

  return null;
}
