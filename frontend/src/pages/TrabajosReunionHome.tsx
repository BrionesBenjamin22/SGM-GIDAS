import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import Tarjeta from "@/components/Tarjeta";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import { HttpError } from "@/lib/http";

import { useTrabajosReunion } from "@/hooks/useTrabajosReunion";
import { useTiposReunion } from "@/hooks/useTiposReunion";
import { useInvestigadores } from "@/hooks/useInvestigadores";

import {
  deleteTrabajoReunion,
  type TrabajoReunion,
} from "@/services/trabajosReunionServices";
import { useAuth } from "@/context/AuthContext";
import { toTitleCase } from "@/utils/format";

const ITEMS_PER_PAGE = 9;

const formatFecha = (fecha?: string | null) => {
  if (!fecha) return "-";

  const [y, m, d] = fecha.split("-");
  if (!y || !m || !d) return fecha;

  return `${d}/${m}/${y}`;
};

export default function TrabajosReunionLanding() {
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
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    estado: "",
    tipo: "",
    procedencia: "",
    investigador: "",
    anio: "",
  });

  const [tempFilters, setTempFilters] = useState(filters);

  const filtroActivos = useMemo<"true" | "false" | "all">(() => {
    if (filters.estado === "todos") return "all";
    if (filters.estado === "inactivos") return "false";
    return "true";
  }, [filters.estado]);

  const { list = [], isLoading, isError } = useTrabajosReunion(filtroActivos, "asc");
  const { tipos = [] } = useTiposReunion();
  const { data: investigadores = [] } = useInvestigadores();

  const trabajosFiltrados = useMemo(() => {
    return list.filter((t) => {
      const query = searchQuery.toLowerCase().trim();

      const matchSearch =
        !query ||
        String(t.titulo_trabajo ?? "").toLowerCase().includes(query) ||
        String(t.nombre_reunion ?? "").toLowerCase().includes(query) ||
        String(t.procedencia ?? "").toLowerCase().includes(query) ||
        String(t.tipo_reunion?.nombre ?? "").toLowerCase().includes(query) ||
        t.investigadores?.some((i) =>
          String(i.nombre_apellido ?? "").toLowerCase().includes(query)
        );

      const matchTipo = !filters.tipo || t.tipo_reunion?.id === Number(filters.tipo);

      const matchProcedencia =
        !filters.procedencia ||
        String(t.procedencia ?? "")
          .toLowerCase()
          .includes(filters.procedencia.toLowerCase());

      const matchInvestigador =
        !filters.investigador ||
        t.investigadores?.some((i) => i.id === Number(filters.investigador));

      const matchAnio =
        !filters.anio ||
        new Date(t.fecha_inicio).getFullYear() === Number(filters.anio);

      return (
        matchSearch &&
        matchTipo &&
        matchProcedencia &&
        matchInvestigador &&
        matchAnio
      );
    });
  }, [list, filters, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(trabajosFiltrados.length / ITEMS_PER_PAGE));
  const trabajosPaginados = trabajosFiltrados.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const filtrosActivosCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filters]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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

    const item = trabajosFiltrados.find((x) => x.id === id);

    if (item?.deleted_at) {
      setErrorMessage(
        "No se puede eliminar un trabajo en reunion cientifica que ya fue eliminado."
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

  const selectedItems = trabajosFiltrados.filter((t) => selectedIds.includes(t.id));
  const selectedActiveItems = selectedItems.filter((t) => !t.deleted_at);

  const confirmDelete = async () => {
    const invalidItems = selectedItems.filter((t) => t.deleted_at);

    if (invalidItems.length > 0) {
      setShowConfirm(false);
      setErrorMessage(
        invalidItems.length === 1
          ? "El trabajo seleccionado ya fue eliminado."
          : "Uno o mas trabajos seleccionados ya fueron eliminados."
      );
      setShowError(true);
      return;
    }

    try {
      for (const item of selectedActiveItems) {
        await deleteTrabajoReunion(item.id);
      }

      await qc.invalidateQueries({
        queryKey: ["trabajos-reunion"],
      });

      cancelSelection();

      setSuccessMessage(
        selectedActiveItems.length === 1
          ? "Trabajo eliminado con exito."
          : "Trabajos eliminados con exito."
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
            "No se pudo eliminar el trabajo en reunion cientifica."
        );
      } else {
        setErrorMessage(
          "Ocurrio un error inesperado al eliminar el trabajo en reunion cientifica."
        );
      }

      setShowError(true);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-80px)] w-full flex-col px-4 py-4 text-sm md:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold leading-none text-slate-800 md:text-3xl">
            Trabajos presentados en Congresos
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            {trabajosFiltrados.length} de {list.length} resultados
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
              placeholder="Buscar por titulo, congreso, investigador..."
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
            <div className="flex gap-2">
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
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/trabajos-reunion/nuevo")}
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

              <Button variant="secondary" size="sm" onClick={cancelSelection}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <p className="py-10 text-center text-slate-500">Cargando...</p>
        ) : isError ? (
          <p className="py-10 text-center text-slate-500">Error al cargar.</p>
        ) : trabajosFiltrados.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No hay trabajos presentados registrados.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trabajosPaginados.map((t: TrabajoReunion) => (
                <Tarjeta<TrabajoReunion>
                  key={t.id}
                  item={t}
                  title={(x) => x.titulo_trabajo || "-"}
                  subtitle={(x) =>
                    `${x.nombre_reunion || "-"} · ${formatFecha(x.fecha_inicio)}`
                  }
                  badge={(x) => (x.deleted_at ? "INACTIVO" : "ACTIVO")}
                  selectable={puedeEliminar && selectMode}
                  selectDisabled={!!t.deleted_at}
                  selected={selectedIds.includes(t.id)}
                  onSelectChange={(checked) => toggleSelect(t.id, checked)}
                  onClick={() => !selectMode && navigate(`/trabajos-reunion/${t.id}`)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>

                <span className="text-sm text-slate-500">
                  Pagina {page} de {totalPages}
                </span>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Eliminar trabajos"
        message="¿Eliminar los siguientes trabajos?"
        items={selectedActiveItems.map((t) => t.titulo_trabajo || "-")}
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
        variant="error"
      />

      {showFilters && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />

          <div className="fixed right-0 top-0 z-50 flex h-full w-[380px] flex-col overflow-y-auto bg-white p-6 shadow-2xl">
            <h3 className="mb-6 text-xl font-semibold">Filtros avanzados</h3>

            <div className="flex-1 space-y-5 text-[11px]">
              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
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
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Tipo de reunion
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.tipo}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      tipo: e.target.value,
                    })
                  }
                >
                  <option value="">Todos los tipos</option>
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {toTitleCase(t.nombre)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Procedencia
                </label>
                <input
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.procedencia}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      procedencia: e.target.value,
                    })
                  }
                  placeholder="Ej: Argentina"
                />
              </div>

              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Investigador
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.investigador}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      investigador: e.target.value,
                    })
                  }
                >
                  <option value="">Todos los investigadores</option>
                  {investigadores.map((i: any) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre_apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Año
                </label>
                <input
                  type="number"
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
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

            <div className="mt-4 flex justify-between gap-2 border-t pt-6">
              <Button
                variant="secondary"
                className="flex-1"
                size="sm"
                onClick={() =>
                  setTempFilters({
                    estado: "",
                    tipo: "",
                    procedencia: "",
                    investigador: "",
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
