import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import Tarjeta from "@/components/Tarjeta";
import ConfirmDialog from "@/components/ConfirmDialog";
import MockIndicator from "@/components/MockIndicator";
import SuccessToast from "@/components/SuccessToast";

import { useTransferencias } from "@/hooks/useTransferencias";
import { deleteTransferencia } from "@/services/transferenciasServices";
import { HttpError } from "@/lib/http";
import { useAuth } from "@/context/AuthContext";

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

  const [filters, setFilters] = useState({
    estado: "",
    demandante: "",
    grupo: "",
    tipoContrato: "",
    anio: "",
  });

  const [tempFilters, setTempFilters] = useState(filters);

  const filtroActivos = useMemo<"true" | "false" | "all">(() => {
    if (filters.estado === "todas") return "all";
    if (filters.estado === "inactivas") return "false";
    return "true";
  }, [filters.estado]);

  const { list = [], isLoading, isError } = useTransferencias(filtroActivos);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const isTransferenciaDeleted = (t: any) => t.activo === false || !!t.deletedAt;

  const transferenciasFiltradas = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return list.filter((t) => {
      const matchSearch =
        !query ||
        String(t.denominacion ?? "").toLowerCase().includes(query) ||
        String(t.descripcionActividad ?? "").toLowerCase().includes(query) ||
        String(t.demandante ?? "").toLowerCase().includes(query) ||
        String(t.tipoContrato ?? "").toLowerCase().includes(query) ||
        String(t.grupo ?? "").toLowerCase().includes(query);

      const matchDemandante =
        !filters.demandante ||
        String(t.demandante ?? "")
          .toLowerCase()
          .includes(filters.demandante.toLowerCase());

      const matchGrupo =
        !filters.grupo ||
        String(t.grupo ?? "")
          .toLowerCase()
          .includes(filters.grupo.toLowerCase());

      const matchTipoContrato =
        !filters.tipoContrato ||
        String(t.tipoContrato ?? "")
          .toLowerCase()
          .includes(filters.tipoContrato.toLowerCase());

      const fechaBase = t.fechaInicio || t.fechaFin || "";
      const matchAnio =
        !filters.anio ||
        (fechaBase &&
          new Date(fechaBase).getFullYear().toString() === filters.anio);

      return (
        matchSearch &&
        matchDemandante &&
        matchGrupo &&
        matchTipoContrato &&
        matchAnio
      );
    });
  }, [list, searchQuery, filters]);

  const aniosDisponibles = useMemo(() => {
    const years = list
      .map((t) => t.fechaInicio || t.fechaFin)
      .filter(Boolean)
      .map((fecha) => new Date(fecha as string).getFullYear())
      .filter((y) => !Number.isNaN(y));

    return [...new Set(years)].sort((a, b) => b - a);
  }, [list]);

  const filtrosActivosCount = Object.values(filters).filter(Boolean).length;

  const setQuickEstado = (estado: "" | "todas" | "inactivas") => {
    setFilters((prev) => ({
      ...prev,
      estado,
    }));
  };

  const quickEstadoActual =
    filters.estado === "todas"
      ? "todas"
      : filters.estado === "inactivas"
        ? "inactivas"
        : "activas";

  const toggleSelect = (id: number, checked: boolean) => {
    if (!puedeEliminar) return;

    const transferencia = transferenciasFiltradas.find((x) => x.id === id);

    if (transferencia && isTransferenciaDeleted(transferencia)) {
      setErrorMessage("No se puede eliminar una transferencia que ya fue eliminada.");
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

  const selectedTransfers = transferenciasFiltradas.filter((t) =>
    selectedIds.includes(t.id)
  );
  const selectedActiveTransfers = selectedTransfers.filter(
    (t) => !isTransferenciaDeleted(t)
  );

  const selectedItems = selectedActiveTransfers.map(
    (t) => t.denominacion || t.descripcionActividad || "—"
  );

  const confirmDelete = async () => {
    const invalidItems = selectedTransfers.filter((t) =>
      isTransferenciaDeleted(t)
    );

    if (invalidItems.length > 0) {
      setShowConfirm(false);
      setErrorMessage(
        invalidItems.length === 1
          ? "La transferencia seleccionada ya fue eliminada."
          : "Una o más transferencias seleccionadas ya fueron eliminadas."
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
          ? "Transferencia eliminada con éxito."
          : "Transferencias eliminadas con éxito."
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
            "No se pudo eliminar la transferencia."
        );
      } else {
        setErrorMessage(
          "Ocurrió un error inesperado al eliminar la transferencia."
        );
      }

      setShowError(true);
    }
  };

  const formatTitle = (value?: string) =>
    value
      ?.toLowerCase()
      .split(" ")
      .map((word) =>
        word ? word.charAt(0).toUpperCase() + word.slice(1) : ""
      )
      .join(" ") || "";

  return (
    <section className="w-full min-h-[calc(100vh-80px)] px-4 md:px-6 py-4 flex flex-col text-sm">
      <MockIndicator />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold leading-none text-slate-800">
            Vinculación Socio-Productiva
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            {transferenciasFiltradas.length} de {list.length} resultados
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
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
              onClick={() => setQuickEstado("todas")}
              className={`px-3 py-1.5 text-xs border-l border-slate-200 transition-colors ${
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
              placeholder="Buscar por denominación, actividad o demandante..."
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
                  onClick={() => navigate("/transferencias/nuevo")}
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
        ) : transferenciasFiltradas.length === 0 ? (
          <p className="text-slate-500 text-center py-10">
            No hay transferencias registradas.
          </p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {transferenciasFiltradas.map((t) => (
              <Tarjeta
                key={t.id}
                item={t}
                title={(x) =>
                  formatTitle(x.denominacion) ||
                  formatTitle(x.descripcionActividad)
                }
                subtitle={(x) =>
                  x.monto !== null && x.monto !== undefined
                    ? `$${x.monto.toLocaleString("es-AR")}`
                    : "Sin monto"
                }
                badge={(x) => (isTransferenciaDeleted(x) ? "INACTIVA" : "ACTIVA")}
                selectable={puedeEliminar && selectMode}
                selectDisabled={isTransferenciaDeleted(t)}
                selected={selectedIds.includes(t.id)}
                onSelectChange={(checked) => toggleSelect(t.id, checked)}
                onClick={() =>
                  !selectMode && navigate(`/transferencias/${t.id}`)
                }
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Eliminar transferencias"
        message="¿Eliminar las siguientes transferencias?"
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
                  <option value="todas">Todas</option>
                  <option value="inactivas">Inactivas</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Demandante
                </label>
                <input
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
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
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Grupo UTN
                </label>
                <input
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
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
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Tipo de contrato
                </label>
                <input
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
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