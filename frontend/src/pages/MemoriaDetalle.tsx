import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import { useAuth } from "@/context/AuthContext";
import { HttpError } from "@/lib/http";
import {
  cambiarEstadoMemoria,
  getMemoriaById,
  reabrirMemoria,
  type Memoria,
  type MemoriaEstado,
} from "@/services/memoriasService";
import { formatFecha } from "@/utils/formatFecha";

const formatFechaHora = (fecha?: string | null) => {
  if (!fecha) return "-";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-AR");
};

export default function MemoriaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const puedeEditar = isAdmin();
  const puedeReabrir = isAdmin();

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [estadoPendiente, setEstadoPendiente] = useState<MemoriaEstado | null>(null);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);

  const { data: memoria, isLoading, isError } = useQuery<Memoria | null>({
    queryKey: ["memoria", id],
    queryFn: () => getMemoriaById(Number(id)),
    enabled: !!id,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

  const handleMutationError = (error: unknown, fallback: string) => {
    if (error instanceof HttpError) {
      const body = error.body as
        | { error?: string; message?: string; detalle?: string }
        | undefined;

      setErrorMessage(body?.error || body?.message || body?.detalle || fallback);
    } else if (error instanceof Error) {
      setErrorMessage(error.message || fallback);
    } else {
      setErrorMessage(fallback);
    }

    setShowError(true);
  };

  const { mutateAsync: actualizarEstado, isPending: isChangingState } = useMutation({
    mutationFn: (estado: MemoriaEstado) =>
      cambiarEstadoMemoria(Number(id), {
        estado,
        fecha_cierre:
          estado === "cerrada" ? new Date().toISOString().slice(0, 19) : undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["memorias"] });
      await queryClient.invalidateQueries({ queryKey: ["memoria", id] });

      setSuccessMessage("Estado de la memoria actualizado con exito.");
      setShowSuccess(true);
      setEstadoPendiente(null);
    },
    onError: (error) => {
      setEstadoPendiente(null);
      handleMutationError(error, "No se pudo actualizar el estado de la memoria.");
    },
  });

  const { mutateAsync: reabrir, isPending: isReopening } = useMutation({
    mutationFn: () =>
      reabrirMemoria(Number(id), {
        fecha_apertura: new Date().toISOString().slice(0, 19),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["memorias"] });
      await queryClient.invalidateQueries({ queryKey: ["memoria", id] });

      setSuccessMessage("Memoria reabierta con exito.");
      setShowSuccess(true);
      setShowReopenConfirm(false);
    },
    onError: (error) => {
      setShowReopenConfirm(false);
      handleMutationError(error, "No se pudo reabrir la memoria.");
    },
  });

  const versionActual = memoria?.version_actual;

  const estadosDisponibles = useMemo(() => {
    if (!versionActual?.estado) return [];

    if (versionActual.estado === "abierta") {
      return ["en revision", "cerrada"] as MemoriaEstado[];
    }

    if (versionActual.estado === "en revision") {
      return ["abierta", "cerrada"] as MemoriaEstado[];
    }

    return [] as MemoriaEstado[];
  }, [versionActual?.estado]);

  if (isLoading) {
    return <p className="text-slate-500">Cargando memoria...</p>;
  }

  if (isError || !memoria || !versionActual) {
    return <p className="text-slate-500">No se encontro la memoria.</p>;
  }

  const anioMemoria = new Date(`${memoria.periodo_fin}T00:00:00`).getFullYear();

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold leading-none md:text-3xl">
              Memoria {anioMemoria}
            </h2>

            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                memoria.deleted_at
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : versionActual.estado === "cerrada"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {memoria.deleted_at ? "INACTIVA" : versionActual.estado.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(`/memorias/${memoria.id}/versiones/${versionActual.id}`)
              }
            >
              Ver elementos registrados
            </Button>

            {puedeEditar &&
              !memoria.deleted_at &&
              estadosDisponibles.map((estado) => (
                <Button
                  key={estado}
                  size="sm"
                  variant="secondary"
                  onClick={() => setEstadoPendiente(estado)}
                >
                  Pasar a {estado}
                </Button>
              ))}

            {puedeReabrir &&
              !memoria.deleted_at &&
              versionActual.estado === "cerrada" && (
                <Button size="sm" onClick={() => setShowReopenConfirm(true)}>
                  Reabrir
                </Button>
              )}
          </div>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-700">
              Datos de la memoria
            </h3>
          </div>

          <div className="space-y-2 text-sm text-slate-500 md:text-base">
            <p>
              <span className="font-medium text-slate-700">Periodo de inicio:</span>{" "}
              {formatFecha(memoria.periodo_inicio)}
            </p>
            <p>
              <span className="font-medium text-slate-700">Periodo de fin:</span>{" "}
              {formatFecha(memoria.periodo_fin)}
            </p>
            <p>
              <span className="font-medium text-slate-700">Cantidad de versiones:</span>{" "}
              {memoria.cantidad_versiones}
            </p>
            <p>
              <span className="font-medium text-slate-700">Creada por:</span>{" "}
              {memoria.created_by_nombre || "-"}
            </p>
            <p>
              <span className="font-medium text-slate-700">Fecha de creacion:</span>{" "}
              {formatFechaHora(memoria.created_at)}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-700">Version actual</h3>
          </div>

          <div className="space-y-2 text-sm text-slate-500 md:text-base">
            <p>
              <span className="font-medium text-slate-700">Numero de version:</span>{" "}
              {versionActual.numero_version}
            </p>
            <p>
              <span className="font-medium text-slate-700">Estado:</span>{" "}
              {versionActual.estado}
            </p>
            <p>
              <span className="font-medium text-slate-700">Fecha de apertura:</span>{" "}
              {formatFechaHora(versionActual.fecha_apertura)}
            </p>
            <p>
              <span className="font-medium text-slate-700">Fecha de cierre:</span>{" "}
              {formatFechaHora(versionActual.fecha_cierre)}
            </p>
            <p>
              <span className="font-medium text-slate-700">Ultima actualizacion:</span>{" "}
              {formatFechaHora(versionActual.updated_at)}
            </p>
            <p>
              <span className="font-medium text-slate-700">Actualizada por:</span>{" "}
              {versionActual.updated_by_nombre || "-"}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-700">
              Historial de versiones
            </h3>
          </div>

          <div className="space-y-3">
            {(memoria.versiones || []).map((version) => (
              <div
                key={version.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1 text-sm text-slate-500">
                  <p>
                    <span className="font-medium text-slate-700">Version:</span>{" "}
                    {version.numero_version}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Estado:</span>{" "}
                    {version.estado}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Apertura:</span>{" "}
                    {formatFechaHora(version.fecha_apertura)}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Cierre:</span>{" "}
                    {formatFechaHora(version.fecha_cierre)}
                  </p>
                </div>

                <div className="flex justify-start md:justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      navigate(`/memorias/${memoria.id}/versiones/${version.id}`)
                    }
                  >
                    Ver elementos
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <div className="flex justify-start pt-4">
          <Button variant="secondary" size="sm" onClick={() => navigate("/memorias")}>
            Volver
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={!!estadoPendiente}
        title="Cambiar estado de memoria"
        message={`Cambiar la memoria al estado "${estadoPendiente || ""}"?`}
        items={[`Version actual: ${versionActual.numero_version}`]}
        onCancel={() => setEstadoPendiente(null)}
        onConfirm={() =>
          estadoPendiente
            ? actualizarEstado(estadoPendiente)
            : Promise.resolve(undefined)
        }
        confirmText={isChangingState ? "Actualizando..." : "Confirmar"}
      />

      <ConfirmDialog
        open={showReopenConfirm}
        title="Reabrir memoria"
        message="Se creara una nueva version abierta a partir de la actual. Desea continuar?"
        items={[`Memoria ${memoria.id}`]}
        onCancel={() => setShowReopenConfirm(false)}
        onConfirm={() => reabrir()}
        confirmText={isReopening ? "Reabriendo..." : "Confirmar"}
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
    </>
  );
}
