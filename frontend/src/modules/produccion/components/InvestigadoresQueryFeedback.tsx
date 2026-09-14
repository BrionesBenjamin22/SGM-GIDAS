import type { UseQueryResult } from "@tanstack/react-query";
import Button from "@/components/Button";
import type { Investigador } from "@/modules/personal/hooks/useInvestigadores";

type Props = {
  query: Pick<UseQueryResult<Investigador[]>, "data" | "isError" | "isFetching" | "refetch">;
};

export default function InvestigadoresQueryFeedback({ query }: Props) {
  if (query.isError) {
    return (
      <div className="space-y-2">
        <p role="alert" className="text-sm text-red-600">
          Lo sentimos, no pudimos recuperar los investigadores. Intente nuevamente.
        </p>
        <Button type="button" variant="secondary" size="sm"
          loading={query.isFetching} loadingText="Cargando investigadores..."
          onClick={() => { void query.refetch(); }}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (query.data === undefined) {
    return <p role="status" className="text-sm text-slate-500">Cargando investigadores...</p>;
  }

  if (query.data.length === 0) {
    return <p role="status" className="text-sm text-slate-500">No hay investigadores activos disponibles.</p>;
  }

  return null;
}
