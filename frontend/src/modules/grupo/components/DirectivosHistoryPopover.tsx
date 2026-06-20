import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, History, RefreshCw, X } from "lucide-react";
import { Popover } from "radix-ui";
import { useHistorialDirectivos } from "@/modules/grupo/hooks/useDirectivos";

const PAGE_SIZE = 3;

type Props = {
  grupoId: number;
};

export default function DirectivosHistoryPopover({ grupoId }: Props) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const {
    data: periodos = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useHistorialDirectivos(grupoId, open);

  const totalPages = Math.max(1, Math.ceil(periodos.length / PAGE_SIZE));
  const visibles = useMemo(
    () => periodos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, periodos]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setPage(1);
  }

  return (
    <Popover.Root modal={false} open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          aria-label="Ver historial del equipo directivo"
        >
          <History className="h-4 w-4" aria-hidden="true" />
          Historial Directivos
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white shadow-xl outline-none"
          aria-label="Historial del equipo directivo"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Historial del equipo directivo
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Períodos registrados, del más reciente al más antiguo.
              </p>
            </div>
            <Popover.Close asChild>
              <button
                type="button"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                title="Cerrar historial"
                aria-label="Cerrar historial"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </Popover.Close>
          </div>

          <div className="min-h-40 px-4 py-3" aria-live="polite">
            {isLoading && <HistoryLoading />}

            {!isLoading && isError && (
              <div className="grid min-h-32 place-items-center text-center">
                <div>
                  <p className="text-sm text-slate-700">
                    Lo sentimos, no pudimos recuperar el historial. Intente
                    nuevamente.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-900 hover:underline disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                      aria-hidden="true"
                    />
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {!isLoading && !isError && periodos.length === 0 && (
              <div className="grid min-h-32 place-items-center text-center text-sm text-slate-500">
                Todavía no hay períodos directivos registrados.
              </div>
            )}

            {!isLoading && !isError && visibles.length > 0 && (
              <ol className="divide-y divide-slate-100">
                {visibles.map((periodo) => (
                  <li key={periodo.id} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {periodo.nombre_apellido}
                        </p>
                        <p className="mt-0.5 text-sm text-slate-600">
                          {periodo.cargo}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
                        <span
                          className={`h-2 w-2 rounded-full ${periodo.fecha_fin ? "bg-slate-400" : "bg-emerald-500"}`}
                          aria-hidden="true"
                        />
                        {periodo.fecha_fin ? "Finalizado" : "Actual"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDateOnly(periodo.fecha_inicio)} a {periodo.fecha_fin
                        ? formatDateOnly(periodo.fecha_fin)
                        : "la actualidad"}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {!isLoading && !isError && periodos.length > PAGE_SIZE && (
            <div className="flex h-11 items-center justify-between border-t border-slate-200 px-3">
              <span className="text-xs text-slate-500">
                Página {page} de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <PageButton
                  label="Página anterior"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </PageButton>
                <PageButton
                  label="Página siguiente"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </PageButton>
              </div>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function HistoryLoading() {
  return (
    <div className="space-y-3" aria-label="Cargando historial">
      {[0, 1, 2].map((item) => (
        <div key={item} className="space-y-2 border-b border-slate-100 pb-3 last:border-0">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function formatDateOnly(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}
