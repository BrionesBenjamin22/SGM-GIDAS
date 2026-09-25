import type { UseQueryResult } from "@tanstack/react-query";
import Button from "@/components/Button";
import type { IntegranteAutor } from "@/modules/produccion/services/trabajoAutoresServices";

type Props = {
  query: Pick<UseQueryResult<IntegranteAutor[]>, "data" | "isError" | "isFetching" | "refetch">;
};

export default function AutoresQueryFeedback({ query }: Props) {
  if (query.isError) {
    return (
      <div className="space-y-2">
        <p role="alert" className="text-sm text-red-600">
          Lo sentimos, no pudimos recuperar los integrantes autores. Intente nuevamente.
        </p>
        <Button type="button" variant="secondary" size="sm"
          loading={query.isFetching} loadingText="Cargando integrantes autores..."
          onClick={() => { void query.refetch(); }}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (query.data === undefined) {
    return <p role="status" className="text-sm text-slate-500">Cargando integrantes autores...</p>;
  }

  if (query.data.length === 0) {
    return <p role="status" className="text-sm text-slate-500">No hay integrantes autores activos disponibles.</p>;
  }

  return null;
}
