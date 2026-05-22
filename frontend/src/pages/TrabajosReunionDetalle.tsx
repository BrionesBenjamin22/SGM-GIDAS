import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import HistorialCambiosCard from "@/components/HistorialCambiosCard";
import SuccessToast from "@/components/SuccessToast";
import { formatFecha } from "@/utils/formatFecha";
import { useAuditoria } from "@/hooks/useAuditoria";
import {
  getHistorialTrabajoReunionById,
  getTrabajoReunionById,
  type TrabajoReunion,
} from "@/services/trabajosReunionServices";
import { useAuth } from "@/context/AuthContext";
import { toTitleCase } from "@/utils/format";
import { useTiposReunion } from "@/hooks/useTiposReunion";
import {
  navigateBackFromMemoriaContext,
  stripSuccessMessageState,
} from "@/lib/memoriaNavigation";

export default function TrabajoReunionDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { canEditRecords } = useAuth();
  const { tipos = [] } = useTiposReunion();

  const puedeEditar = canEditRecords();
  const trabajoId = id ? Number(id) : undefined;

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { data, isLoading, isError } = useQuery<TrabajoReunion>({
    queryKey: ["trabajo-reunion", trabajoId],
    queryFn: () => getTrabajoReunionById(trabajoId as number),
    enabled: !!trabajoId,
    refetchOnMount: "always",
  });

  const { data: historialCambios = [], isLoading: isLoadingHistorial } = useQuery({
    queryKey: ["trabajo-reunion-historial", trabajoId],
    queryFn: () => getHistorialTrabajoReunionById(trabajoId as number),
    enabled: !!trabajoId,
    refetchOnMount: "always",
  });

  const auditoria = useAuditoria(data);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      navigate(location.pathname, {
        replace: true,
        state: stripSuccessMessageState(location.state),
      });
    }
  }, [location.state, navigate, location.pathname]);

  if (isLoading) return <p className="text-slate-500">Cargando...</p>;
  if (isError || !data) {
    return <p className="text-slate-500">Trabajo en reunion cientifica no encontrado.</p>;
  }

  const isDeleted = !!data.deleted_at;

  const formatFechaHora = (fecha?: string | null) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleString("es-AR");
  };

  const formatHistorialValue = (
    item: { campo?: string },
    value: unknown,
    kind: "anterior" | "nuevo"
  ) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    const asNumber =
      typeof value === "number"
        ? value
        : typeof value === "string" && value.trim() !== ""
          ? Number(value)
          : NaN;

    if (item.campo === "tipo_reunion_id") {
      return tipos.find((tipo) => tipo.id === asNumber)?.nombre ?? String(value);
    }

    if (item.campo === "investigadores" && typeof value === "object" && value !== null) {
      const payload = value as {
        detalle?: { nombre_apellido?: string };
      };
      if (kind === "anterior") {
        return "-";
      }
      return payload.detalle?.nombre_apellido ?? "Investigador";
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "-";
      }
    }

    return String(value);
  };

  const investigadores =
    data.investigadores && data.investigadores.length > 0
      ? data.investigadores.map((inv) => inv.nombre_apellido).join(", ")
      : "-";

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold leading-none md:text-3xl">
              {data.titulo_trabajo || "-"}
            </h2>

            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                isDeleted
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {isDeleted ? "INACTIVO" : "ACTIVO"}
            </span>
          </div>

          {puedeEditar && !isDeleted && (
            <Button size="sm" onClick={() => navigate(`/trabajos-reunion/${data.id}/editar`)}>
              Editar
            </Button>
          )}
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="space-y-2 break-words text-sm text-slate-500 md:text-base">
            <p>
              <span className="font-medium text-slate-700">Reunion:</span>{" "}
              {toTitleCase(data.nombre_reunion) || "-"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Tipo de reunion:</span>{" "}
              {toTitleCase(data.tipo_reunion?.nombre) || "-"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Procedencia:</span>{" "}
              {toTitleCase(data.procedencia) || "-"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Fecha:</span>{" "}
              {formatFecha(data.fecha_inicio)}
            </p>

            <p>
              <span className="font-medium text-slate-700">Investigadores:</span>{" "}
              {investigadores}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-700">Auditoria</h3>
            <p className="mt-1 text-xs text-slate-500">{data.titulo_trabajo || "-"}</p>
          </div>

          <div className="space-y-2 text-sm text-slate-500 md:text-base">
            <p>
              <span className="font-medium text-slate-700">Creado por:</span>{" "}
              {auditoria.nombreCreador}
            </p>

            <p>
              <span className="font-medium text-slate-700">Fecha de creacion:</span>{" "}
              {formatFechaHora(data.created_at)}
            </p>

            <p>
              <span className="font-medium text-slate-700">Eliminado por:</span>{" "}
              {auditoria.nombreEliminador}
            </p>

            <p>
              <span className="font-medium text-slate-700">Fecha de eliminacion:</span>{" "}
              {formatFechaHora(data.deleted_at)}
            </p>
          </div>
        </article>

        <HistorialCambiosCard
          subtitle={data.titulo_trabajo || "-"}
          items={historialCambios}
          isLoading={isLoadingHistorial}
          updatedAt={data.updated_at}
          updatedByName={data.updated_by_nombre}
          formatItemValue={(item, value, kind) =>
            formatHistorialValue(item, value, kind)
          }
        />

        <div className="flex justify-start pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigateBackFromMemoriaContext(navigate, location, "/trabajos-reunion")
            }
          >
            Volver
          </Button>
        </div>
      </section>

      <SuccessToast
        open={showSuccess}
        message={successMessage}
        onClose={() => setShowSuccess(false)}
      />
    </>
  );
}
