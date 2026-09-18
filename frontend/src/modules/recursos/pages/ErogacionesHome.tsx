import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import Tarjeta from "@/components/Tarjeta";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import MemoriaFilterBanner from "@/components/MemoriaFilterBanner";

import { useErogaciones } from "@/modules/recursos/hooks/useErogaciones";
import { useTiposErogacion } from "@/modules/recursos/hooks/useTipoErogacion";
import { useFuentesFinanciamiento } from "@/modules/catalogos/hooks/useFuenteFinanciamiento";
import { deleteErogaciones } from "@/modules/recursos/services/erogacionesServices";
import { getErrorMessage } from "@/lib/httpError";
import { useAuth } from "@/context/AuthContext";
import {
  applyMemoriaSectionFilter,
  getMemoriaSectionFilter,
} from "@/lib/memoriaSectionFilter";
import { buildMemoriaDetailState } from "@/lib/memoriaNavigation";
import { getCivilYear } from "@/utils/dateTime";

const ITEMS_PER_PAGE = 9;

export default function ErogacionesLanding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const location = useLocation();
  const { canCreateRecords, canDeleteRecords } = useAuth();

  const puedeCrear = canCreateRecords();
  const puedeEliminar = canDeleteRecords();

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [filtroActivos, setFiltroActivos] = useState<"true" | "false" | "all">(
    "true"
  );

  const { tipos } = useTiposErogacion();
  const { fuentes } = useFuentesFinanciamiento();

  const [filters, setFilters] = useState({
    search: "",
    tipoId: "",
    fuenteId: "",
    ingresosMin: "",
    egresosMin: "",
    anio: "",
  });

  const [tempFilters, setTempFilters] = useState(filters);
  const [currentPage, setCurrentPage] = useState(1);
  const memoriaFilter = useMemo(
    () => getMemoriaSectionFilter(location.state, "erogaciones"),
    [location.state]
  );
  const effectiveActivos = memoriaFilter ? "all" : filtroActivos;
  const { list = [], isLoading, isError } = useErogaciones(effectiveActivos);
  const scopedList = useMemo(
    () => applyMemoriaSectionFilter(list, memoriaFilter),
    [list, memoriaFilter]
  );
  const filtrosActivos = Object.values(filters).filter(Boolean).length;

  const aniosDisponibles = useMemo(() => {
    const years = scopedList
      .filter((item) => item.fecha)
      .map((item) => getCivilYear(item.fecha))
      .filter((year): year is number => year !== null);

    return [...new Set(years)].sort((a, b) => b - a);
  }, [scopedList]);

  const erogacionesFiltradas = useMemo(() => {
    return scopedList.filter((item) => {
      const search = filters.search.toLowerCase().trim();

      const matchSearch =
        !search ||
        String(item.numero_erogacion ?? "").includes(search) ||
        String(item.tipo_erogacion?.nombre ?? "").toLowerCase().includes(search) ||
        String(item.fuente?.nombre ?? "").toLowerCase().includes(search);

      const matchTipo =
        !filters.tipoId || item.tipo_erogacion?.id?.toString() === filters.tipoId;

      const matchFuente =
        !filters.fuenteId || item.fuente?.id?.toString() === filters.fuenteId;

      const matchIngresos =
        !filters.ingresosMin || item.ingresos >= Number(filters.ingresosMin);

      const matchEgresos =
        !filters.egresosMin || item.egresos >= Number(filters.egresosMin);

      const matchAnio =
        !filters.anio ||
        getCivilYear(item.fecha)?.toString() === filters.anio;

      return (
        matchSearch &&
        matchTipo &&
        matchFuente &&
        matchIngresos &&
        matchEgresos &&
        matchAnio
      );
    });
  }, [scopedList, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(erogacionesFiltradas.length / ITEMS_PER_PAGE)
  );

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return erogacionesFiltradas.slice(start, start + ITEMS_PER_PAGE);
  }, [erogacionesFiltradas, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, filtroActivos]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const toggleSelect = (id: number, checked: boolean) => {
    if (!puedeEliminar) return;

    const erogacion = scopedList.find((item) => item.id === id);

    if (erogacion?.deleted_at) {
      setErrorMessage("No se puede eliminar una erogación que ya fue eliminada.");
      setShowError(true);
      return;
    }

    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((value) => value !== id)
    );
  };

  const cancelSelection = () => {
    if (isDeleting) return;
    setSelectMode(false);
    setSelectedIds([]);
    setShowConfirm(false);
  };

  const selectedItems = scopedList.filter((item) => selectedIds.includes(item.id));
  const selectedActiveItems = selectedItems.filter((item) => !item.deleted_at);

  const confirmDelete = async () => {
    if (isDeleting) return;

    const invalidItems = selectedItems.filter((item) => item.deleted_at);

    if (invalidItems.length > 0) {
      setShowConfirm(false);
      setErrorMessage(
        invalidItems.length === 1
          ? "La erogación seleccionada ya fue eliminada."
          : "Una o más erogaciones seleccionadas ya fueron eliminadas."
      );
      setShowError(true);
      return;
    }

    try {
      setIsDeleting(true);

      for (const item of selectedActiveItems) {
        await deleteErogaciones(item.id);
      }

      await qc.invalidateQueries({ queryKey: ["erogaciones"] });
      cancelSelection();

      setSuccessMessage(
        selectedActiveItems.length === 1
          ? "Erogación eliminada con éxito."
          : "Erogaciones eliminadas con éxito."
      );
      setShowSuccess(true);
    } catch (error) {
      setShowConfirm(false);
      setErrorMessage(
        getErrorMessage(
          error,
          "Lo sentimos, no pudimos completar la operación. Intente nuevamente."
        )
      );

      setShowError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-80px)] w-full flex-col px-4 py-4 text-sm md:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold leading-none text-slate-800 md:text-3xl">
            Resumen de ingresos y egresos
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            {erogacionesFiltradas.length} de {scopedList.length} resultados
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setFiltroActivos("true")}
              className={`px-3 py-1.5 text-xs transition-colors ${
                filtroActivos === "true"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Activas
            </button>

            <button
              type="button"
              onClick={() => setFiltroActivos("all")}
              className={`border-l border-slate-200 px-3 py-1.5 text-xs transition-colors ${
                filtroActivos === "all"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todas
            </button>

            <button
              type="button"
              onClick={() => setFiltroActivos("false")}
              className={`border-l border-slate-200 px-3 py-1.5 text-xs transition-colors ${
                filtroActivos === "false"
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
              placeholder="Buscar por número, tipo o fuente..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-10 text-xs outline-none transition-all focus:bg-white focus:ring-2 focus:ring-slate-200"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
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
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTempFilters(filters);
                  setShowFilters(true);
                }}
              >
                Filtros
                {filtrosActivos > 0 && (
                  <span className="ml-1.5 rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] text-white">
                    {filtrosActivos}
                  </span>
                )}
              </Button>

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
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/erogaciones/nuevo")}
                >
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
        ) : erogacionesFiltradas.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No hay erogaciones registradas.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((item) => (
              <Tarjeta
                key={item.id}
                item={item}
                title={(x) =>
                  `Erogación N.º ${String(x.numero_erogacion).padStart(6, "0")}`
                }
                subtitle={(x) => x.tipo_erogacion?.nombre || "-"}
                badge={(x) => (x.deleted_at ? "INACTIVA" : "ACTIVA")}
                selectable={puedeEliminar && selectMode}
                selectDisabled={!!item.deleted_at}
                selected={selectedIds.includes(item.id)}
                onSelectChange={(checked) => toggleSelect(item.id, checked)}
                onClick={() =>
                  !selectMode &&
                  navigate(`/erogaciones/${item.id}`, {
                    state: buildMemoriaDetailState(location),
                  })
                }
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8">
            <nav aria-label="Paginación" className="flex flex-wrap items-center justify-center gap-2">
              <Button type="button" size="sm" variant="secondary" aria-label="Página anterior"
                disabled={currentPage === 1} onClick={() => setCurrentPage((current) => current - 1)}>
                {"<"}
              </Button>
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button type="button" key={pageNumber} aria-label={`Página ${pageNumber}`}
                    aria-current={currentPage === pageNumber ? "page" : undefined}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`rounded-lg px-3 py-1 text-sm ${
                      currentPage === pageNumber ? "bg-slate-800 text-white" : "bg-slate-100 hover:bg-slate-200"
                    }`}>
                    {pageNumber}
                  </button>
                );
              })}
              <Button type="button" size="sm" variant="secondary" aria-label="Página siguiente"
                disabled={currentPage === totalPages} onClick={() => setCurrentPage((current) => current + 1)}>
                {">"}
              </Button>
            </nav>
          </div>
        )}
      </div>

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
                  Año
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

              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-slate-400">
                  Número de erogación
                </label>
                <input
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.search}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      search: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-slate-400">
                  Tipo
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.tipoId}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      tipoId: e.target.value,
                    })
                  }
                >
                  <option value="">Todos</option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-slate-400">
                  Fuente
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.fuenteId}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      fuenteId: e.target.value,
                    })
                  }
                >
                  <option value="">Todas</option>
                  {fuentes.map((fuente) => (
                    <option key={fuente.id} value={fuente.id}>
                      {fuente.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-slate-400">
                  Ingresos mínimos
                </label>
                <input
                  type="number"
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.ingresosMin}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      ingresosMin: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-slate-400">
                  Egresos mínimos
                </label>
                <input
                  type="number"
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.egresosMin}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      egresosMin: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex justify-between gap-2 border-t pt-6">
              <Button
                variant="secondary"
                className="flex-1"
                size="sm"
                onClick={() =>
                  setTempFilters({
                    search: "",
                    tipoId: "",
                    fuenteId: "",
                    ingresosMin: "",
                    egresosMin: "",
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

      <ConfirmDialog
        open={showConfirm}
        title="Eliminar erogaciones"
        message="¿Eliminar las siguientes erogaciones?"
        items={selectedActiveItems.map(
          (item) =>
            `Erogación N.º ${String(item.numero_erogacion).padStart(6, "0")}`
        )}
        onCancel={cancelSelection}
        onConfirm={confirmDelete}
        confirmText={isDeleting ? "Eliminando..." : "Aceptar"}
        confirmDisabled={isDeleting}
       loadingText="Eliminando..."
     />

      <SuccessToast
        open={showSuccess}
        message={successMessage || "Eliminado con éxito."}
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
