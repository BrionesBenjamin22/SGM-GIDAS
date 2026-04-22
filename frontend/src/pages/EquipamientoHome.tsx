import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import Tarjeta from "@/components/Tarjeta";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import { HttpError } from "@/lib/http";
import { useEquipamiento } from "@/hooks/useEquipamiento";
import { useAuth } from "@/context/AuthContext";

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

  const [filters, setFilters] = useState({
    estado: "",
    montoMin: "",
    montoMax: "",
    anio: "",
  });

  const [tempFilters, setTempFilters] = useState(filters);

  const filtroActivos = useMemo<"true" | "false" | "all">(() => {
    if (filters.estado === "todos") return "all";
    if (filters.estado === "inactivos") return "false";
    return "true";
  }, [filters.estado]);

  const { list = [], isLoading, isError, remove } =
    useEquipamiento(filtroActivos);

  const aniosDisponibles = useMemo(() => {
    const years = list
      .filter((e) => e.fecha_incorporacion)
      .map((e) => new Date(e.fecha_incorporacion).getFullYear());

    return [...new Set(years)].sort((a, b) => b - a);
  }, [list]);

  const equipamientoFiltrado = useMemo(() => {
    return list.filter((e) => {
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
        new Date(e.fecha_incorporacion).getFullYear().toString() ===
          filters.anio;

      return matchSearch && matchMontoMin && matchMontoMax && matchAnio;
    });
  }, [list, searchQuery, filters]);

  const filtrosActivosCount = Object.values(filters).filter(Boolean).length;

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(equipamientoFiltrado.length / ITEMS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return equipamientoFiltrado.slice(start, start + ITEMS_PER_PAGE);
  }, [equipamientoFiltrado, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

    const item = equipamientoFiltrado.find((x) => x.id === id);

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

  const selectedItems = equipamientoFiltrado.filter((e) =>
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
          : "Uno o más equipamientos seleccionados ya fueron eliminados."
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
          ? "Equipamiento eliminado con éxito."
          : "Equipamientos eliminados con éxito."
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
          "Ocurrió un error inesperado al eliminar el equipamiento."
        );
      }

      setShowError(true);
    }
  };

  return (
    <section className="w-full min-h-[calc(100vh-80px)] px-4 md:px-6 py-4 flex flex-col text-sm">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold leading-none text-slate-800">
            Equipamiento e Infraestructura
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            {equipamientoFiltrado.length} de {list.length} resultados
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-end">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
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
              className={`px-3 py-1.5 text-xs border-l border-slate-200 transition-colors ${
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
              className={`px-3 py-1.5 text-xs border-l border-slate-200 transition-colors ${
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
              placeholder="Buscar por denominación o descripción..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-1.5 focus:bg-white focus:ring-2 focus:ring-slate-200 outline-none transition-all text-xs"
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
                  <span className="ml-1.5 bg-slate-800 text-white text-[10px] rounded-full px-1.5 py-0.5">
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

      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <p className="text-slate-500 text-center py-10">Cargando…</p>
        ) : isError ? (
          <p className="text-slate-500 text-center py-10">Error al cargar.</p>
        ) : equipamientoFiltrado.length === 0 ? (
          <p className="text-slate-500 text-center py-10">
            No hay equipamiento registrado.
          </p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((e) => (
              <Tarjeta
                key={e.id}
                item={e}
                title={(x) => x.denominacion || "—"}
                subtitle={(x) => x.descripcion_breve || "Sin descripción"}
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
            <div className="flex justify-center items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ←
              </Button>

              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      currentPage === page
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <Button
                size="sm"
                variant="secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                →
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Eliminar equipamiento"
        message="¿Eliminar los siguientes ítems?"
        items={selectedActiveItems.map((e) => e.denominacion || "—")}
        onCancel={cancelSelection}
        onConfirm={confirmDelete}
      />

      <SuccessToast
        open={showSuccess}
        message={successMessage || "Eliminado con éxito!"}
        onClose={() => setShowSuccess(false)}
      />

      <SuccessToast
        open={showError}
        message={errorMessage}
        onClose={() => setShowError(false)}
      />

      {showFilters && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setShowFilters(false)}
          />

          <div className="fixed top-0 right-0 h-full w-[380px] bg-white z-50 shadow-2xl p-6 flex flex-col overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6">Filtros Avanzados</h3>

            <div className="space-y-5 flex-1 text-[11px]">
              <div>
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Estado
                </label>
                <select
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
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
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Monto mínimo
                </label>
                <input
                  type="number"
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
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
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Monto máximo
                </label>
                <input
                  type="number"
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
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
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Año de incorporación
                </label>
                <select
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
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

            <div className="flex justify-between gap-2 pt-6 border-t mt-4">
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