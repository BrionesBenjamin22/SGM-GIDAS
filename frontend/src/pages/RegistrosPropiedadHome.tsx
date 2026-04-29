import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import Tarjeta from "@/components/Tarjeta";
import MemoriaFilterBanner from "@/components/MemoriaFilterBanner";
import { useAuth } from "@/context/AuthContext";
import { HttpError } from "@/lib/http";
import { useRegistrosPropiedad } from "@/hooks/useRegistrosPropiedad";
import {
  deleteRegistroPropiedad,
  type RegistroPropiedad,
} from "@/services/registrosPropiedadServices";
import { toTitleCase } from "@/utils/format";
import {
  applyMemoriaSectionFilter,
  getMemoriaSectionFilter,
} from "@/lib/memoriaSectionFilter";

const ITEMS_PER_PAGE = 9;

const formatFecha = (fecha?: string | null) => {
  if (!fecha) return "-";

  const [y, m, d] = fecha.split("-");
  if (!y || !m || !d) return fecha;

  return `${d}/${m}/${y}`;
};

export default function RegistrosPropiedadLanding() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
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
    tipoRegistro: "",
    fechaRegistro: "",
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const memoriaFilter = useMemo(
    () => getMemoriaSectionFilter(location.state, "registros-propiedad"),
    [location.state]
  );

  const filtroActivos = useMemo<"true" | "false" | "all">(() => {
    if (memoriaFilter) return "all";
    if (filters.estado === "todos") return "all";
    if (filters.estado === "inactivos") return "false";
    return "true";
  }, [filters.estado, memoriaFilter]);

  const { list, isLoading, isError } = useRegistrosPropiedad(
    filtroActivos,
    "asc"
  );
  const scopedList = useMemo(
    () => applyMemoriaSectionFilter(list, memoriaFilter),
    [list, memoriaFilter]
  );

  const opcionesFiltros = useMemo(() => {
    const tiposRegistro = new Set<string>();
    const fechasRegistro = new Set<string>();

    scopedList.forEach((registro) => {
      if (registro.tipo_registro != null) {
        tiposRegistro.add(toTitleCase(registro.tipo_registro));
      }

      if (registro.fecha_registro) {
        fechasRegistro.add(formatFecha(registro.fecha_registro));
      }
    });

    return {
      tiposRegistro: Array.from(tiposRegistro).sort(),
      fechasRegistro: Array.from(fechasRegistro).sort(),
    };
  }, [scopedList]);

  const registrosFiltrados = useMemo(() => {
    return scopedList.filter((registro) => {
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        String(registro.nombre_articulo ?? "").toLowerCase().includes(query) ||
        String(registro.tipo_registro ?? "").toLowerCase().includes(query) ||
        String(registro.fecha_registro ?? "").toLowerCase().includes(query) ||
        String(registro.organismo_registrante ?? "")
          .toLowerCase()
          .includes(query);

      const matchTipoRegistro =
        !filters.tipoRegistro ||
        toTitleCase(registro.tipo_registro) === filters.tipoRegistro;

      const matchFechaRegistro =
        !filters.fechaRegistro ||
        formatFecha(registro.fecha_registro) === filters.fechaRegistro;

      return matchesSearch && matchTipoRegistro && matchFechaRegistro;
    });
  }, [scopedList, filters, searchQuery]);

  const totalPages = Math.ceil(registrosFiltrados.length / ITEMS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return registrosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, registrosFiltrados]);

  const filtrosActivosCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

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

    const item = scopedList.find((registro) => registro.id === id);

    if (item?.deleted_at) {
      setErrorMessage(
        "No se puede eliminar un registro de propiedad que ya fue eliminado."
      );
      setShowError(true);
      return;
    }

    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((currentId) => currentId !== id)
    );
  };

  const cancelSelection = () => {
    setSelectMode(false);
    setSelectedIds([]);
    setShowConfirm(false);
  };

  const selectedItems = scopedList.filter((registro) =>
    selectedIds.includes(registro.id)
  );
  const selectedActiveItems = selectedItems.filter(
    (registro) => !registro.deleted_at
  );

  const confirmDelete = async () => {
    const invalidItems = selectedItems.filter((registro) => registro.deleted_at);

    if (invalidItems.length > 0) {
      setShowConfirm(false);
      setErrorMessage(
        invalidItems.length === 1
          ? "El registro seleccionado ya fue eliminado."
          : "Uno o mas registros seleccionados ya fueron eliminados."
      );
      setShowError(true);
      return;
    }

    try {
      for (const item of selectedActiveItems) {
        await deleteRegistroPropiedad(item.id);
      }

      await qc.invalidateQueries({ queryKey: ["registros-propiedad"] });
      cancelSelection();

      setSuccessMessage(
        selectedActiveItems.length === 1
          ? "Registro eliminado con exito."
          : "Registros eliminados con exito."
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
            "No se pudo eliminar el registro de propiedad."
        );
      } else {
        setErrorMessage(
          "Ocurrio un error inesperado al eliminar el registro de propiedad."
        );
      }

      setShowError(true);
    }
  };

  return (
    <>
      <section className="flex min-h-[calc(100vh-80px)] w-full flex-col px-4 py-4 text-sm md:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-semibold leading-none text-slate-800 md:text-3xl">
              Registros de Propiedad
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              {registrosFiltrados.length} de {scopedList.length} resultados
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
                placeholder="Buscar por nombre, tipo, organismo..."
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
                    onClick={() => navigate("/registros-propiedad/nuevo")}
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

        {memoriaFilter && <MemoriaFilterBanner filter={memoriaFilter} />}

        <div className="flex-1">
          {isLoading ? (
            <p className="py-10 text-center text-slate-500">Cargando...</p>
          ) : isError ? (
            <p className="py-10 text-center text-slate-500">Error al cargar.</p>
          ) : registrosFiltrados.length === 0 ? (
            <p className="py-10 text-center text-slate-500">
              No hay registros de propiedad registrados.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedItems.map((registro: RegistroPropiedad) => (
                  <Tarjeta<RegistroPropiedad>
                    key={registro.id}
                    item={registro}
                    title={(item) => item.nombre_articulo || "-"}
                    subtitle={(item) =>
                      `${toTitleCase(item.tipo_registro) || "-"} · ${formatFecha(
                        item.fecha_registro
                      )}`
                    }
                    badge={(item) => (item.deleted_at ? "INACTIVO" : "ACTIVO")}
                    selectable={puedeEliminar && selectMode}
                    selectDisabled={!!registro.deleted_at}
                    selected={selectedIds.includes(registro.id)}
                    onSelectChange={(checked) =>
                      toggleSelect(registro.id, checked)
                    }
                    onClick={() =>
                      !selectMode &&
                      navigate(`/registros-propiedad/${registro.id}`)
                    }
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((page) => page - 1)}
                    >
                      {"<"}
                    </Button>

                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`rounded-lg px-3 py-1 text-sm ${
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
                      onClick={() => setCurrentPage((page) => page + 1)}
                    >
                      {">"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <ConfirmDialog
          open={showConfirm}
          title="Eliminar registros"
          message="¿Eliminar los siguientes registros?"
          items={selectedActiveItems.map((registro) => registro.nombre_articulo || "-")}
          onCancel={cancelSelection}
          onConfirm={confirmDelete}
        />
      </section>

      {showFilters && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-[380px] flex-col overflow-y-auto bg-white p-6 shadow-2xl">
            <h3 className="mb-6 text-xl font-semibold">Filtros Avanzados</h3>

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
                  Tipo de Registro
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.tipoRegistro}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      tipoRegistro: e.target.value,
                    })
                  }
                >
                  <option value="">Todos los tipos</option>
                  {opcionesFiltros.tiposRegistro.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Fecha de Registro
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.fechaRegistro}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      fechaRegistro: e.target.value,
                    })
                  }
                >
                  <option value="">Todas las fechas</option>
                  {opcionesFiltros.fechasRegistro.map((fecha) => (
                    <option key={fecha} value={fecha}>
                      {fecha}
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
                    tipoRegistro: "",
                    fechaRegistro: "",
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
    </>
  );
}
