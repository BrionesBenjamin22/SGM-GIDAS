import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import Tarjeta from "@/components/Tarjeta";
import { useAuth } from "@/context/AuthContext";
import { HttpError } from "@/lib/http";
import {
  deleteMemoria,
  getMemorias,
  type Memoria,
  type MemoriaActivosFilter,
} from "@/services/memoriasService";
import { formatFecha } from "@/utils/formatFecha";

const ITEMS_PER_PAGE = 9;

const formatFechaHora = (fecha?: string | null) => {
  if (!fecha) return "-";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-AR");
};

const buildTitle = (memoria: Memoria) =>
  `Memoria ${new Date(`${memoria.periodo_fin}T00:00:00`).getFullYear()}`;

const renderEstadoBadge = (estado?: string, inactiva?: boolean) => {
  if (inactiva) {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-700">
        Inactiva
      </span>
    );
  }

  if (estado === "en revision") {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-700">
        En revision
      </span>
    );
  }

  if (estado === "cerrada") {
    return (
      <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
        Cerrada
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
      Abierta
    </span>
  );
};

export default function MemoriasHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const puedeCrear = isAdmin();
  const puedeEliminar = isAdmin();

  const [estadoRapido, setEstadoRapido] = useState<MemoriaActivosFilter>("true");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: memorias = [], isLoading, isError } = useQuery({
    queryKey: ["memorias", estadoRapido],
    queryFn: () => getMemorias(estadoRapido),
  });

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

  const memoriasFiltradas = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return memorias.filter((memoria) => {
      if (!query) return true;

      const estado = memoria.version_actual?.estado || "";
      const numeroVersion = memoria.version_actual?.numero_version || "";

      return [
        memoria.periodo_inicio,
        memoria.periodo_fin,
        estado,
        String(numeroVersion),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [memorias, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(memoriasFiltradas.length / ITEMS_PER_PAGE)
  );

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return memoriasFiltradas.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, memoriasFiltradas]);

  useEffect(() => {
    setCurrentPage(1);
  }, [estadoRapido, searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const { mutateAsync: eliminarMemoria, isPending: isDeleting } = useMutation({
    mutationFn: (memoriaId: number) => deleteMemoria(memoriaId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["memorias"] });
      setSuccessMessage("Memoria eliminada con exito.");
      setShowSuccess(true);
      setSelectedIds([]);
      setSelectMode(false);
      setShowConfirm(false);
    },
    onError: (error) => {
      const fallback = "No se pudo eliminar la memoria.";

      if (error instanceof HttpError) {
        const body = error.body as
          | { error?: string; message?: string; detalle?: string }
          | undefined;

        setErrorMessage(body?.error || body?.message || body?.detalle || fallback);
      } else if (error instanceof Error) {
        setErrorMessage(error.message || fallback);
      } else {
        setErrorMessage(fallback);
      }

      setShowError(true);
      setShowConfirm(false);
    },
  });

  const toggleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((value) => value !== id)
    );
  };

  const cancelSelection = () => {
    setSelectMode(false);
    setSelectedIds([]);
    setShowConfirm(false);
  };

  const selectedMemorias = memorias.filter((memoria) => selectedIds.includes(memoria.id));

  return (
    <section className="flex min-h-[calc(100vh-80px)] w-full flex-col px-4 py-4 text-sm md:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold leading-none text-slate-800 md:text-3xl">
            Memorias
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            {memoriasFiltradas.length} de {memorias.length} resultados
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setEstadoRapido("true")}
              className={`px-3 py-1.5 text-xs transition-colors ${
                estadoRapido === "true"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Activas
            </button>

            <button
              type="button"
              onClick={() => setEstadoRapido("all")}
              className={`border-l border-slate-200 px-3 py-1.5 text-xs transition-colors ${
                estadoRapido === "all"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todas
            </button>

            <button
              type="button"
              onClick={() => setEstadoRapido("false")}
              className={`border-l border-slate-200 px-3 py-1.5 text-xs transition-colors ${
                estadoRapido === "false"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Inactivas
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar por estado o periodo..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-10 text-xs outline-none transition-all focus:bg-white focus:ring-2 focus:ring-slate-200"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          {!selectMode ? (
            <>
              {puedeEliminar && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectMode(true)}
                >
                  Seleccionar
                </Button>
              )}

              {puedeCrear && (
                <Button size="sm" onClick={() => navigate("/memorias/nueva")}>
                  Nueva
                </Button>
              )}
            </>
          ) : (
            <>
              {selectedIds.length > 0 && (
                <Button size="sm" onClick={() => setShowConfirm(true)}>
                  Eliminar
                </Button>
              )}

              <Button variant="secondary" size="sm" onClick={cancelSelection}>
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {isLoading ? (
          <p className="py-10 text-center text-slate-500">Cargando...</p>
        ) : isError ? (
          <p className="py-10 text-center text-slate-500">
            Error al cargar memorias.
          </p>
        ) : memoriasFiltradas.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No hay memorias registradas.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((memoria) => {
              const anioMemoria = new Date(`${memoria.periodo_fin}T00:00:00`).getFullYear();
              const snapshotListo = memoria.version_actual?.estado === "cerrada";

              return (
                <Tarjeta
                  key={memoria.id}
                  item={memoria}
                  title={() => `Memoria ${anioMemoria}`}
                  subtitle={(item) =>
                    [
                      `Periodo: ${formatFecha(item.periodo_inicio)} - ${formatFecha(
                        item.periodo_fin
                      )}`,
                      `Version actual: ${item.version_actual?.numero_version ?? "-"}`,
                      `Elementos: ${
                        snapshotListo
                          ? item.cantidad_elementos ?? 0
                          : "Disponibles al cerrar la memoria"
                      }`,
                    ].join(" - ")
                  }
                  badge={(item) =>
                    renderEstadoBadge(item.version_actual?.estado, !!item.deleted_at)
                  }
                  selectable={selectMode && puedeEliminar}
                  selected={selectedIds.includes(memoria.id)}
                  onSelectChange={(checked) => toggleSelect(memoria.id, checked)}
                  onClick={() => !selectMode && navigate(`/memorias/${memoria.id}`)}
                />
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-auto pt-8">
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>

              <span className="text-sm text-slate-500">
                Pagina {currentPage} de {totalPages}
              </span>

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Eliminar memoria"
        message="Eliminar las memorias seleccionadas?"
        items={selectedMemorias.map((memoria) => buildTitle(memoria))}
        onCancel={cancelSelection}
        onConfirm={async () => {
          for (const memoria of selectedMemorias) {
            await eliminarMemoria(memoria.id);
          }
        }}
        confirmText={isDeleting ? "Eliminando..." : "Confirmar"}
      />

      <SuccessToast
        open={showSuccess}
        message={successMessage}
        onClose={() => setShowSuccess(false)}
      />

      <SuccessToast
        open={showError}
        message={errorMessage}
        onClose={() => setShowError(false)}
        variant="error"
      />
    </section>
  );
}
