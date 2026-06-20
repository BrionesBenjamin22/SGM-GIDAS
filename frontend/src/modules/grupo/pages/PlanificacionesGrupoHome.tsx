import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Tarjeta from "@/components/Tarjeta";
import ConfirmDialog from "@/components/ConfirmDialog";
import { usePlanificaciones } from "@/modules/grupo/hooks/usePlanificacionesGrupo";
import { deletePlanificacion } from "@/modules/grupo/services/planificacionGrupoServices";
import SuccessToast from "@/components/SuccessToast";
import { HttpError } from "@/lib/http";
import { useAuth } from "@/context/AuthContext";

export default function PlanificacionGrupoLanding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { canCreateRecords, canDeleteRecords } = useAuth();

  const puedeCrear = canCreateRecords();
  const puedeEliminar = canDeleteRecords();

  const [filtroActivos, setFiltroActivos] = useState<"true" | "false" | "all">("true");
  const { list = [], isLoading, isError } = usePlanificaciones(filtroActivos);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const toggleSelect = (id: number, checked: boolean) => {
    if (!puedeEliminar) return;

    const planificacion = list.find((x) => x.id === id);

    if (planificacion && !planificacion.activo) {
      setErrorMessage("No se puede eliminar una planificación que ya fue eliminada.");
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

  const selectedPlans = list.filter((p) => selectedIds.includes(p.id));
  const selectedActivePlans = selectedPlans.filter((p) => p.activo);

  const selectedItems = selectedActivePlans.map(
    (p) => `Planificación ${p.anio}`
  );

  const confirmDelete = async () => {
    const invalidItems = selectedPlans.filter((p) => !p.activo);

    if (invalidItems.length > 0) {
      setShowConfirm(false);
      setErrorMessage(
        invalidItems.length === 1
          ? "La planificación seleccionada ya fue eliminada."
          : "Una o más planificaciones seleccionadas ya fueron eliminadas."
      );
      setShowError(true);
      return;
    }

    try {
      for (const item of selectedActivePlans) {
        await deletePlanificacion(item.id);
      }

      await qc.invalidateQueries({ queryKey: ["planificaciones"] });
      cancelSelection();

      setSuccessMessage(
        selectedActivePlans.length === 1
          ? "Planificación eliminada con éxito."
          : "Planificaciones eliminadas con éxito."
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
            "No se pudo eliminar la planificación."
        );
      } else {
        setErrorMessage(
          "Ocurrió un error inesperado al eliminar la planificación."
        );
      }

      setShowError(true);
    }
  };

  return (
    <section className="w-full min-h-[calc(100vh-80px)] px-4 py-2 flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold leading-none">
            Planificaciones
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            {list.length} resultados
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
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
              className={`px-3 py-1.5 text-xs border-l border-slate-200 transition-colors ${
                filtroActivos === "all"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todas
            </button>
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

              {puedeCrear && (
                <Button
                  size="sm"
                  onClick={() => navigate("/planificaciones/nuevo")}
                >
                  Agregar nuevo
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {selectedIds.length > 0 && puedeEliminar && (
                <Button
                  size="sm"
                  onClick={() => setShowConfirm(true)}
                >
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
        {isLoading && <p className="text-slate-500">Cargando…</p>}
        {isError && (
          <p className="text-red-600">Error al cargar.</p>
        )}

        {!isLoading && !isError && (
          list.length === 0 ? (
            <p className="text-slate-500">
              No hay planificaciones activas.
            </p>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <Tarjeta
                  key={p.id}
                  item={p}
                  title={(x) => `Planificación ${x.anio}`}
                  subtitle={(x) => x.grupo || "Sin grupo"}
                  badge={(x) => (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        x.activo
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {x.activo ? "ACTIVA" : "ELIMINADA"}
                    </span>
                  )}
                  selectable={puedeEliminar && selectMode}
                  selectDisabled={!p.activo}
                  selected={selectedIds.includes(p.id)}
                  onSelectChange={(checked) =>
                    toggleSelect(p.id, checked)
                  }
                  onClick={() =>
                    !selectMode && navigate(`/planificaciones/${p.id}`)
                  }
                />
              ))}
            </div>
          )
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Eliminar planificaciones"
        message="¿Estás seguro de eliminar las siguientes planificaciones?"
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
    </section>
  );
}
