import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Tarjeta from "@/components/Tarjeta";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useDocumentacion } from "@/hooks/useDocumentacion";
import { deleteDocumentacion } from "@/services/documentacionServices";
import SuccessToast from "@/components/SuccessToast";
import { HttpError } from "@/lib/http";
import { useAuth } from "@/context/AuthContext";

export default function DocumentacionHome() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const location = useLocation();
  const { canCreateRecords, canDeleteRecords } = useAuth();

  const puedeCrear = canCreateRecords();
  const puedeEliminar = canDeleteRecords();

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState({
    estado: "",
    autor: "",
    anio: "",
  });

  const [tempFilters, setTempFilters] = useState(filters);

  const filtroActivos = useMemo<"true" | "false" | "all">(() => {
    if (filters.estado === "todos") return "all";
    if (filters.estado === "inactivas") return "false";
    return "true";
  }, [filters.estado]);

  const { list = [], isLoading, isError } = useDocumentacion(filtroActivos);

  const aniosDisponibles = useMemo(() => {
    const years = list
      .filter((d) => d.anio)
      .map((d) => Number(d.anio))
      .filter((y) => !Number.isNaN(y));

    return [...new Set(years)].sort((a, b) => b - a);
  }, [list]);

  const documentacionFiltrada = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return list.filter((d) => {
      const autoresTexto = d.autores?.length
        ? d.autores.map((a) => a.nombre_apellido).join(", ")
        : "";

      const matchSearch =
        !query ||
        String(d.titulo ?? "").toLowerCase().includes(query) ||
        autoresTexto.toLowerCase().includes(query) ||
        String(d.editorial ?? "").toLowerCase().includes(query) ||
        String(d.anio ?? "").toLowerCase().includes(query);

      const matchAutor =
        !filters.autor ||
        (d.autores?.some((a) =>
          String(a.nombre_apellido ?? "")
            .toLowerCase()
            .includes(filters.autor.toLowerCase())
        ) ??
          false);

      const matchAnio = !filters.anio || String(d.anio ?? "") === filters.anio;

      return matchSearch && matchAutor && matchAnio;
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

  const setQuickEstado = (estado: "" | "todos" | "inactivas") => {
    setFilters((prev) => ({
      ...prev,
      estado,
    }));
  };

  const quickEstadoActual =
    filters.estado === "todos"
      ? "todos"
      : filters.estado === "inactivas"
        ? "inactivas"
        : "activas";

  const toggleSelect = (id: number, checked: boolean) => {
    if (!puedeEliminar) return;

    const documento = documentacionFiltrada.find((x) => x.id === id);

    if (documento?.deleted_at) {
      setErrorMessage("No se puede eliminar un documento que ya fue eliminado.");
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

  const selectedDocuments = documentacionFiltrada.filter((d) =>
    selectedIds.includes(d.id)
  );
  const selectedActiveDocuments = selectedDocuments.filter((d) => !d.deleted_at);

  const selectedItems = selectedActiveDocuments.map((d) => d.titulo);

  const confirmDelete = async () => {
    const invalidItems = selectedDocuments.filter((d) => d.deleted_at);

    if (invalidItems.length > 0) {
      setShowConfirm(false);
      setErrorMessage(
        invalidItems.length === 1
          ? "El documento seleccionado ya fue eliminado."
          : "Uno o más documentos seleccionados ya fueron eliminados."
      );
      setShowError(true);
      return;
    }

    try {
      for (const item of selectedActiveDocuments) {
        await deleteDocumentacion(item.id);
      }

      await qc.invalidateQueries({ queryKey: ["documentacion"] });
      cancelSelection();

      setSuccessMessage(
        selectedActiveDocuments.length === 1
          ? "Documentación eliminada con éxito."
          : "Documentación eliminada con éxito."
      );
      setShowSuccess(true);
    } catch (error) {
      setShowConfirm(false);

      if (error instanceof HttpError) {
        const body = error.body as
          | {
              message?: string;
              error?: string;
              detalle?: string;
            }
          | undefined;

        setErrorMessage(
          body?.message ||
            body?.error ||
            body?.detalle ||
            "No se pudo eliminar la documentación."
        );
      } else {
        setErrorMessage(
          "Ocurrió un error inesperado al eliminar la documentación."
        );
      }

      setShowError(true);
    }
  };

  const formatTitulo = (titulo: string) =>
    titulo
      .toLowerCase()
      .split(" ")
      .map((word) =>
        word ? word.charAt(0).toUpperCase() + word.slice(1) : ""
      )
      .join(" ");

  return (
    <section className="w-full min-h-[calc(100vh-80px)] px-4 md:px-6 py-4 flex flex-col text-sm">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold leading-none text-slate-800">
            Documentación
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            {documentacionFiltrada.length} de {list.length} resultados
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-end">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
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
              onClick={() => setQuickEstado("todos")}
              className={`px-3 py-1.5 text-xs border-l border-slate-200 transition-colors ${
                quickEstadoActual === "todos"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todas
            </button>

            <button
              type="button"
              onClick={() => setQuickEstado("inactivas")}
              className={`px-3 py-1.5 text-xs border-l border-slate-200 transition-colors ${
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
              placeholder="Buscar por título, autor, editorial o año..."
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
                  onClick={() => navigate("/documentacion/nuevo")}
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
        ) : documentacionFiltrada.length === 0 ? (
          <p className="text-slate-500 text-center py-10">
            No hay documentación registrada.
          </p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {documentacionFiltrada.map((d) => (
              <Tarjeta
                key={d.id}
                item={d}
                title={(x) => formatTitulo(x.titulo)}
                subtitle={(x) => {
                  const autores = x.autores?.length
                    ? x.autores.map((a) => a.nombre_apellido).join(", ")
                    : "Sin autores";

                  const anio = x.anio ?? "—";

                  return `Autores: ${autores} · Año: ${anio}`;
                }}
                badge={(x) => (x.deleted_at ? "INACTIVA" : "ACTIVA")}
                selectable={puedeEliminar && selectMode}
                selectDisabled={!!d.deleted_at}
                selected={selectedIds.includes(d.id)}
                onSelectChange={(checked) => toggleSelect(d.id, checked)}
                onClick={() =>
                  !selectMode && navigate(`/documentacion/${d.id}`)
                }
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Eliminar documentación"
        message="¿Eliminar los siguientes documentos?"
        items={selectedItems}
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
                  <option value="">Activas (Default)</option>
                  <option value="todos">Todas</option>
                  <option value="inactivas">Inactivas</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Autor
                </label>
                <input
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
                  value={tempFilters.autor}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      autor: e.target.value,
                    })
                  }
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Año
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
                    autor: "",
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