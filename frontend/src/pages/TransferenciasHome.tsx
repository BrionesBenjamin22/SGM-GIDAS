import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import Tarjeta from "@/components/Tarjeta";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import MemoriaFilterBanner from "@/components/MemoriaFilterBanner";

import { useTransferencias } from "@/hooks/useTransferencias";
import { deleteTransferencia } from "@/services/transferenciasServices";
import { HttpError } from "@/lib/http";
import { useAuth } from "@/context/AuthContext";
import {
  applyMemoriaSectionFilter,
  getMemoriaSectionFilter,
} from "@/lib/memoriaSectionFilter";
import { buildMemoriaDetailState } from "@/lib/memoriaNavigation";

const ITEMS_PER_PAGE = 9;

export default function TransferenciasHome() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const location = useLocation();
  const { canCreateRecords, canDeleteRecords } = useAuth();

  const puedeCrear = canCreateRecords();
  const puedeEliminar = canDeleteRecords();

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    estado: "",
    demandante: "",
    grupo: "",
    tipoContrato: "",
    anio: "",
  });

  const [tempFilters, setTempFilters] = useState(filters);
  const memoriaFilter = useMemo(
    () => getMemoriaSectionFilter(location.state, "transferencias"),
    [location.state]
  );

  const filtroActivos = useMemo<"true" | "false" | "all">(() => {
    if (memoriaFilter) return "all";
    if (filters.estado === "todas") return "all";
    if (filters.estado === "inactivas") return "false";
    return "true";
  }, [filters.estado, memoriaFilter]);

  const { list = [], isLoading, isError } = useTransferencias(filtroActivos);
  const scopedList = useMemo(
    () => applyMemoriaSectionFilter(list, memoriaFilter),
    [list, memoriaFilter]
  );

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const isTransferenciaDeleted = (item: any) => item.activo === false || !!item.deletedAt;

  const transferenciasFiltradas = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return scopedList.filter((item) => {
      const matchSearch =
        !query ||
        String(item.denominacion ?? "").toLowerCase().includes(query) ||
        String(item.descripcionActividad ?? "").toLowerCase().includes(query) ||
        String(item.demandante ?? "").toLowerCase().includes(query) ||
        String(item.tipoContrato ?? "").toLowerCase().includes(query) ||
        String(item.grupo ?? "").toLowerCase().includes(query);

      const matchDemandante =
        !filters.demandante ||
        String(item.demandante ?? "")
          .toLowerCase()
          .includes(filters.demandante.toLowerCase());

      const matchGrupo =
        !filters.grupo ||
        String(item.grupo ?? "").toLowerCase().includes(filters.grupo.toLowerCase());

      const matchTipoContrato =
        !filters.tipoContrato ||
        String(item.tipoContrato ?? "")
          .toLowerCase()
          .includes(filters.tipoContrato.toLowerCase());

      const fechaBase = item.fechaInicio || item.fechaFin || "";
      const matchAnio =
        !filters.anio ||
        (fechaBase && new Date(fechaBase).getFullYear().toString() === filters.anio);

      return (
        matchSearch &&
        matchDemandante &&
        matchGrupo &&
        matchTipoContrato &&
        matchAnio
      );
    });
  }, [scopedList, searchQuery, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(transferenciasFiltradas.length / ITEMS_PER_PAGE)
  );

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return transferenciasFiltradas.slice(start, start + ITEMS_PER_PAGE);
  }, [transferenciasFiltradas, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const aniosDisponibles = useMemo(() => {
    const years = scopedList
      .map((item) => item.fechaInicio || item.fechaFin)
      .filter(Boolean)
      .map((fecha) => new Date(fecha as string).getFullYear())
      .filter((year) => !Number.isNaN(year));

    return [...new Set(years)].sort((a, b) => b - a);
  }, [scopedList]);

  const filtrosActivosCount = Object.values(filters).filter(Boolean).length;

  const setQuickEstado = (estado: "" | "todas" | "inactivas") => {
    setFilters((prev) => ({ ...prev, estado }));
  };

  const quickEstadoActual =
    filters.estado === "todas"
      ? "todas"
      : filters.estado === "inactivas"
        ? "inactivas"
        : "activas";

  const toggleSelect = (id: number, checked: boolean) => {
    if (!puedeEliminar) return;

    const transferencia = scopedList.find((item) => item.id === id);

    if (transferencia && isTransferenciaDeleted(transferencia)) {
      setErrorMessage("No se puede eliminar una transferencia que ya fue eliminada.");
      setShowError(true);
      return;
    }

    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((value) => value !== id)
    );
  };

  const cancelSelection = () => {
    setSelectMode(false);
    setSelectedIds([]);
    setShowConfirm(false);
  };

  const selectedTransfers = scopedList.filter((item) => selectedIds.includes(item.id));
  const selectedActiveTransfers = selectedTransfers.filter(
    (item) => !isTransferenciaDeleted(item)
  );

  const confirmDelete = async () => {
    const invalidItems = selectedTransfers.filter((item) =>
      isTransferenciaDeleted(item)
    );

    if (invalidItems.length > 0) {
      setShowConfirm(false);
      setErrorMessage(
        invalidItems.length === 1
          ? "La transferencia seleccionada ya fue eliminada."
          : "Una o mas transferencias seleccionadas ya fueron eliminadas."
      );
      setShowError(true);
      return;
    }

    try {
      for (const item of selectedActiveTransfers) {
        await deleteTransferencia(item.id);
      }

      await qc.invalidateQueries({ queryKey: ["transferencias"] });
      cancelSelection();

      setSuccessMessage(
        selectedActiveTransfers.length === 1
          ? "Transferencia eliminada con exito."
          : "Transferencias eliminadas con exito."
      );
      setShowSuccess(true);
    } catch (error) {
      setShowConfirm(false);

      if (error instanceof HttpError) {
        const body = error.body as
          | { message?: string; error?: string; detalle?: string }
          | undefined;

        setErrorMessage(
          body?.message ||
            body?.error ||
            body?.detalle ||
            "No se pudo eliminar la transferencia."
        );
      } else {
        setErrorMessage(
          "Ocurrio un error inesperado al eliminar la transferencia."
        );
      }

      setShowError(true);
    }
  };

  const formatTitle = (value?: string) =>
    value
      ?.toLowerCase()
      .split(" ")
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
      .join(" ") || "";

  return (
    <section className="flex min-h-[calc(100vh-80px)] w-full flex-col px-4 py-4 text-sm md:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold leading-none text-slate-800 md:text-3xl">
            Vinculacion socio-productiva
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            {transferenciasFiltradas.length} de {scopedList.length} resultados
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setQuickEstado("")}
              className={`px-3 py-1.5 text-xs transition-colors ${
                quickEstadoActual === "activas"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Activas
            </button>

            <button
              type="button"
              onClick={() => setQuickEstado("todas")}
              className={`border-l border-slate-200 px-3 py-1.5 text-xs transition-colors ${
                quickEstadoActual === "todas"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todas
            </button>

            <button
              type="button"
              onClick={() => setQuickEstado("inactivas")}
              className={`border-l border-slate-200 px-3 py-1.5 text-xs transition-colors ${
                quickEstadoActual === "inactivas"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Inactivas
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por denominacion, actividad o demandante..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-10 text-xs outline-none transition-all focus:bg-white focus:ring-2 focus:ring-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {!selectMode ? (
            <>
              {puedeEliminar && (
                <Button variant="secondary" size="sm" onClick={() => setSelectMode(true)}>
                  Seleccionar
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTempFilters(filters);
                  setShowFilters(true);
                }}
              >
                Filtros
                {filtrosActivosCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] text-white">
                    {filtrosActivosCount}
                  </span>
                )}
              </Button>

              {puedeCrear && (
                <Button variant="primary" size="sm" onClick={() => navigate("/transferencias/nuevo")}>
                  Nuevo
                </Button>
              )}
            </>
          ) : (
            <>
              {selectedIds.length > 0 && puedeEliminar && (
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

      {memoriaFilter && <MemoriaFilterBanner filter={memoriaFilter} />}

      <div className="flex flex-1 flex-col">
        {isLoading ? (
          <p className="py-10 text-center text-slate-500">Cargando...</p>
        ) : isError ? (
          <p className="py-10 text-center text-slate-500">Error al cargar.</p>
        ) : transferenciasFiltradas.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No hay transferencias registradas.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((item) => (
              <Tarjeta
                key={item.id}
                item={item}
                title={(x) =>
                  formatTitle(x.denominacion) || formatTitle(x.descripcionActividad)
                }
                subtitle={(x) =>
                  x.monto !== null && x.monto !== undefined
                    ? `$${x.monto.toLocaleString("es-AR")}`
                    : "Sin monto"
                }
                badge={(x) => (isTransferenciaDeleted(x) ? "INACTIVA" : "ACTIVA")}
                selectable={puedeEliminar && selectMode}
                selectDisabled={isTransferenciaDeleted(item)}
                selected={selectedIds.includes(item.id)}
                onSelectChange={(checked) => toggleSelect(item.id, checked)}
                onClick={() =>
                  !selectMode &&
                  navigate(`/transferencias/${item.id}`, {
                    state: buildMemoriaDetailState(location),
                  })
                }
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-auto pt-8">
            <div className="flex items-center justify-between">
              <Button
                type="button"
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
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
        title="Eliminar transferencias"
        message="Eliminar las siguientes transferencias?"
        items={selectedActiveTransfers.map(
          (item) => item.denominacion || item.descripcionActividad || "-"
        )}
        onCancel={cancelSelection}
        onConfirm={confirmDelete}
      />

      <SuccessToast
        open={showSuccess}
        message={successMessage || "Eliminado con exito."}
        onClose={() => setShowSuccess(false)}
      />

      <SuccessToast
        open={showError}
        message={errorMessage}
        onClose={() => setShowError(false)}
        variant="error"
      />

      {showFilters && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />

          <div className="fixed top-0 right-0 z-50 flex h-full w-[380px] flex-col overflow-y-auto bg-white p-6 shadow-2xl">
            <h3 className="mb-6 text-xl font-semibold">Filtros avanzados</h3>

            <div className="flex-1 space-y-5 text-[11px]">
              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-slate-400">
                  Estado
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.estado}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      estado: e.target.value,
                    })
                  }
                >
                  <option value="">Activas (Default)</option>
                  <option value="todas">Todas</option>
                  <option value="inactivas">Inactivas</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-slate-400">
                  Demandante
                </label>
                <input
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.demandante}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      demandante: e.target.value,
                    })
                  }
                  placeholder="Ej: Empresa X"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-slate-400">
                  Grupo UTN
                </label>
                <input
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.grupo}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      grupo: e.target.value,
                    })
                  }
                  placeholder="Ej: GIDAS"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-slate-400">
                  Tipo de contrato
                </label>
                <input
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.tipoContrato}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      tipoContrato: e.target.value,
                    })
                  }
                  placeholder="Ej: Convenio"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-slate-400">
                  Ano
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.anio}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      anio: e.target.value,
                    })
                  }
                >
                  <option value="">Todos</option>
                  {aniosDisponibles.map((anio) => (
                    <option key={anio} value={anio}>
                      {anio}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-between gap-2 border-t pt-6">
              <Button
                variant="secondary"
                className="flex-1"
                size="sm"
                onClick={() =>
                  setTempFilters({
                    estado: "",
                    demandante: "",
                    grupo: "",
                    tipoContrato: "",
                    anio: "",
                  })
                }
              >
                Limpiar
              </Button>

              <Button
                className="flex-1"
                size="sm"
                onClick={() => {
                  setFilters(tempFilters);
                  setShowFilters(false);
                }}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
