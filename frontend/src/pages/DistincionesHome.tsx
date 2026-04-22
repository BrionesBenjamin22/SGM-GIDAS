import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import Tarjeta from "@/components/Tarjeta";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import { HttpError } from "@/lib/http";

import { useDistinciones } from "@/hooks/useDistinciones";
import type { Distincion } from "@/services/distincionesServices";
import { useAuth } from "@/context/AuthContext";

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "—";

  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;

  return `${d}/${m}/${y}`;
};

export default function DistincionesHome() {
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
    proyecto: "",
    anio: "",
  });

  const [tempFilters, setTempFilters] = useState(filters);

  const filtroActivos = useMemo<"true" | "false" | "all">(() => {
    if (filters.estado === "todos") return "all";
    if (filters.estado === "inactivos") return "false";
    return "true";
  }, [filters.estado]);

  const { list = [], isLoading, isError, remove } = useDistinciones(filtroActivos);

  const distincionesFiltradas = useMemo(() => {
    return list.filter((d) => {
      const query = searchQuery.toLowerCase().trim();

      const matchSearch =
        !query ||
        String(d.descripcion ?? "").toLowerCase().includes(query) ||
        String(d.proyecto?.nombre ?? "").toLowerCase().includes(query) ||
        String(d.fecha ?? "").toLowerCase().includes(query);

      const matchProyecto =
        !filters.proyecto ||
        String(d.proyecto?.nombre ?? "")
          .toLowerCase()
          .includes(filters.proyecto.toLowerCase());

      const matchAnio =
        !filters.anio ||
        new Date(d.fecha).getFullYear() === Number(filters.anio);

      return matchSearch && matchProyecto && matchAnio;
    });
  }, [list, searchQuery, filters]);

  const filtrosActivosCount = Object.values(filters).filter(Boolean).length;

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

    const item = distincionesFiltradas.find((x) => x.id === id);

    if (item?.deleted_at) {
      setErrorMessage(
        "No se puede eliminar una distinción que ya fue eliminada."
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

  const selectedItems = distincionesFiltradas.filter((d) =>
    selectedIds.includes(d.id)
  );
  const selectedActiveItems = selectedItems.filter((d) => !d.deleted_at);

  const confirmDelete = async () => {
    const invalidItems = selectedItems.filter((d) => d.deleted_at);

    if (invalidItems.length > 0) {
      setShowConfirm(false);
      setErrorMessage(
        invalidItems.length === 1
          ? "La distinción seleccionada ya fue eliminada."
          : "Una o más distinciones seleccionadas ya fueron eliminadas."
      );
      setShowError(true);
      return;
    }

    try {
      for (const item of selectedActiveItems) {
        await remove(item.id);
      }

      await qc.invalidateQueries({ queryKey: ["distinciones"] });

      cancelSelection();

      setSuccessMessage(
        selectedActiveItems.length === 1
          ? "Distinción eliminada con éxito."
          : "Distinciones eliminadas con éxito."
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
            "No se pudo eliminar la distinción."
        );
      } else {
        setErrorMessage(
          "Ocurrió un error inesperado al eliminar la distinción."
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
            Distinciones Recibidas
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            {distincionesFiltradas.length} de {list.length} resultados
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
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
              placeholder="Buscar por descripción, proyecto o fecha..."
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
            <div className="flex gap-2">
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
                  onClick={() => navigate("/distinciones/nuevo")}
                >
                  Nuevo
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
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
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <p className="text-slate-500 text-center py-10">Cargando…</p>
        ) : isError ? (
          <p className="text-slate-500 text-center py-10">Error al cargar.</p>
        ) : distincionesFiltradas.length === 0 ? (
          <p className="text-slate-500 text-center py-10">
            No hay distinciones registradas.
          </p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {distincionesFiltradas.map((d: Distincion) => (
              <Tarjeta<Distincion>
                key={d.id}
                item={d}
                title={(x) => x.descripcion || "—"}
                subtitle={(x) =>
                  `${formatDate(x.fecha)} · ${x.proyecto?.nombre || "Sin proyecto"}`
                }
                badge={(x) => (x.deleted_at ? "INACTIVO" : "ACTIVO")}
                selectable={puedeEliminar && selectMode}
                selectDisabled={!!d.deleted_at}
                selected={selectedIds.includes(d.id)}
                onSelectChange={(checked) => toggleSelect(d.id, checked)}
                onClick={() => !selectMode && navigate(`/distinciones/${d.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Eliminar distinciones"
        message="¿Eliminar las siguientes distinciones?"
        items={selectedActiveItems.map((d) => d.descripcion || "—")}
        onCancel={cancelSelection}
        onConfirm={confirmDelete}
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
                  Proyecto
                </label>
                <input
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
                  value={tempFilters.proyecto}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      proyecto: e.target.value,
                    })
                  }
                  placeholder="Ej: Sistema de Gestión"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Año
                </label>
                <input
                  type="number"
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
                  value={tempFilters.anio}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      anio: e.target.value,
                    })
                  }
                  placeholder="Ej: 2025"
                />
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
                    proyecto: "",
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