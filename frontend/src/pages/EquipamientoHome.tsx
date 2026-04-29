import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import Tarjeta from "@/components/Tarjeta";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import MemoriaFilterBanner from "@/components/MemoriaFilterBanner";
import { HttpError } from "@/lib/http";
import { useEquipamiento } from "@/hooks/useEquipamiento";
import { useAuth } from "@/context/AuthContext";
import {
  applyMemoriaSectionFilter,
  getMemoriaSectionFilter,
} from "@/lib/memoriaSectionFilter";

const ITEMS_PER_PAGE = 9;

export default function EquipamientoLanding() {
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

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    estado: "",
    montoMin: "",
    montoMax: "",
    anio: "",
  });

  const [tempFilters, setTempFilters] = useState(filters);
  const memoriaFilter = useMemo(
    () => getMemoriaSectionFilter(location.state, "equipamiento"),
    [location.state]
  );

  const filtroActivos = useMemo<"true" | "false" | "all">(() => {
    if (memoriaFilter) return "all";
    if (filters.estado === "todos") return "all";
    if (filters.estado === "inactivos") return "false";
    return "true";
  }, [filters.estado, memoriaFilter]);

  const { list = [], isLoading, isError, remove } =
    useEquipamiento(filtroActivos);
  const scopedList = useMemo(
    () => applyMemoriaSectionFilter(list, memoriaFilter),
    [list, memoriaFilter]
  );

  const aniosDisponibles = useMemo(() => {
    const years = scopedList
      .filter((e) => e.fecha_incorporacion)
      .map((e) => new Date(e.fecha_incorporacion).getFullYear());

    return [...new Set(years)].sort((a, b) => b - a);
  }, [scopedList]);

  const equipamientoFiltrado = useMemo(() => {
    return scopedList.filter((e) => {
      const query = searchQuery.toLowerCase().trim();

      const matchSearch =
        !query ||
        String(e.denominacion ?? "").toLowerCase().includes(query) ||
        String(e.descripcion_breve ?? "").toLowerCase().includes(query);

      const matchMontoMin =
        !filters.montoMin || e.monto_invertido >= Number(filters.montoMin);

      const matchMontoMax =
        !filters.montoMax || e.monto_invertido <= Number(filters.montoMax);

      const matchAnio =
        !filters.anio ||
        new Date(e.fecha_incorporacion).getFullYear().toString() === filters.anio;

      return matchSearch && matchMontoMin && matchMontoMax && matchAnio;
    });
  }, [scopedList, searchQuery, filters]);

  const filtrosActivosCount = Object.values(filters).filter(Boolean).length;

  const totalPages = Math.max(
    1,
    Math.ceil(equipamientoFiltrado.length / ITEMS_PER_PAGE)
  );

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return equipamientoFiltrado.slice(start, start + ITEMS_PER_PAGE);
  }, [equipamientoFiltrado, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

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

  const setQuickEstado = (estado: "" | "todos" | "inactivos") => {
    setFilters((prev) => ({
      ...prev,
      estado,
    }));
  };

  const quickEstadoActual =
    filters.estado === "todos"
      ? "todos"
      : filters.estado === "inactivos"
        ? "inactivos"
        : "activos";

  const toggleSelect = (id: number, checked: boolean) => {
    if (!puedeEliminar) return;

    const item = scopedList.find((x) => x.id === id);

    if (item?.deleted_at) {
      setErrorMessage(
        "No se puede eliminar un equipamiento que ya fue eliminado."
      );
      setShowError(true);
      return;
    }

    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const cancelSelection = () => {
    setSelectMode(false);
    setSelectedIds([]);
    setShowConfirm(false);
  };

  const selectedItems = scopedList.filter((e) =>
    selectedIds.includes(e.id)
  );
  const selectedActiveItems = selectedItems.filter((e) => !e.deleted_at);

  const confirmDelete = async () => {
    const invalidItems = selectedItems.filter((e) => e.deleted_at);

    if (invalidItems.length > 0) {
      setShowConfirm(false);
      setErrorMessage(
        invalidItems.length === 1
          ? "El equipamiento seleccionado ya fue eliminado."
          : "Uno o mas equipamientos seleccionados ya fueron eliminados."
      );
      setShowError(true);
      return;
    }

    try {
      for (const item of selectedActiveItems) {
        await remove(item.id);
      }

      await qc.invalidateQueries({ queryKey: ["equipamiento"] });
      cancelSelection();

      setSuccessMessage(
        selectedActiveItems.length === 1
          ? "Equipamiento eliminado con exito."
          : "Equipamientos eliminados con exito."
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
            "No se pudo eliminar el equipamiento."
        );
      } else {
        setErrorMessage(
          "Ocurrio un error inesperado al eliminar el equipamiento."
        );
      }

      setShowError(true);
    }
  };

  return (
    <section className="w-full min-h-[calc(100vh-80px)] px-4 py-4 flex flex-col text-sm md:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold leading-none text-slate-800 md:text-3xl">
            Equipamiento e Infraestructura
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            {equipamientoFiltrado.length} de {scopedList.length} resultados
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setQuickEstado("")}
              className={`px-3 py-1.5 text-xs transition-colors ${
                quickEstadoActual === "activos"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Activos
            </button>

            <button
              type="button"
              onClick={() => setQuickEstado("todos")}
              className={`border-l border-slate-200 px-3 py-1.5 text-xs transition-colors ${
                quickEstadoActual === "todos"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todos
            </button>

            <button
              type="button"
              onClick={() => setQuickEstado("inactivos")}
              className={`border-l border-slate-200 px-3 py-1.5 text-xs transition-colors ${
                quickEstadoActual === "inactivos"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Inactivos
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por denominacion o descripcion..."
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectMode(true)}
                >
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
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/equipamiento/nuevo")}
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

              <Button
                variant="secondary"
                size="sm"
                onClick={cancelSelection}
              >
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
        ) : equipamientoFiltrado.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No hay equipamiento registrado.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((e) => (
              <Tarjeta
                key={e.id}
                item={e}
                title={(x) => x.denominacion || "-"}
                subtitle={(x) => x.descripcion_breve || "Sin descripcion"}
                badge={(x) => (x.deleted_at ? "INACTIVO" : "ACTIVO")}
                selectable={puedeEliminar && selectMode}
                selectDisabled={!!e.deleted_at}
                selected={selectedIds.includes(e.id)}
                onSelectChange={(checked) => toggleSelect(e.id, checked)}
                onClick={() => !selectMode && navigate(`/equipamiento/${e.id}`)}
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
        title="Eliminar equipamiento"
        message="¿Eliminar los siguientes items?"
        items={selectedActiveItems.map((e) => e.denominacion || "-")}
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
                  <option value="">Activos (Default)</option>
                  <option value="todos">Todos</option>
                  <option value="inactivos">Inactivos</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-slate-400">
                  Monto minimo
                </label>
                <input
                  type="number"
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.montoMin}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      montoMin: e.target.value,
                    })
                  }
                  placeholder="Ej: 100000"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-slate-400">
                  Monto maximo
                </label>
                <input
                  type="number"
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.montoMax}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      montoMax: e.target.value,
                    })
                  }
                  placeholder="Ej: 500000"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold uppercase tracking-wider text-slate-400">
                  Ano de incorporacion
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
                    montoMin: "",
                    montoMax: "",
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
