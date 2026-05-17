import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import HistorialCambiosCard from "@/components/HistorialCambiosCard";
import SuccessToast from "@/components/SuccessToast";
import {
  getHistorialParticipacionById,
  getParticipacionById,
} from "@/services/participacionesServices";
import { useAuditoria } from "@/hooks/useAuditoria";
import { useAuth } from "@/context/AuthContext";
import { useInvestigadores } from "@/hooks/useInvestigadores";
import {
  navigateBackFromMemoriaContext,
  stripSuccessMessageState,
} from "@/lib/memoriaNavigation";

const FORMA_PARTICIPACION_LABELS: Record<string, string> = {
  jurado: "Jurado",
  evaluador: "Evaluador",
  panelista: "Panelista",
  comite: "Miembro de comite cientifico",
};

export default function ParticipacionesDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { canEditRecords } = useAuth();
  const { data: investigadores = [] } = useInvestigadores();

  const puedeEditar = canEditRecords();
  const participacionId = id ? Number(id) : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["participacion", participacionId],
    queryFn: () => getParticipacionById(participacionId as number),
    enabled: !!participacionId,
    refetchOnMount: "always",
  });

  const { data: historialCambios = [], isLoading: isLoadingHistorial } = useQuery({
    queryKey: ["participacion-historial", participacionId],
    queryFn: () => getHistorialParticipacionById(participacionId as number),
    enabled: !!participacionId,
    refetchOnMount: "always",
  });

  const auditoria = useAuditoria(data);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  const investigadoresMap = useMemo(
    () =>
      new Map(
        investigadores.map((investigador) => [investigador.id, investigador.nombre_apellido])
      ),
    [investigadores]
  );

  const formatFecha = (fecha?: string | Date | null) => {
    if (!fecha) return "-";

    if (fecha instanceof Date) {
      const d = String(fecha.getDate()).padStart(2, "0");
      const m = String(fecha.getMonth() + 1).padStart(2, "0");
      const y = fecha.getFullYear();
      return `${d}/${m}/${y}`;
    }

    const dateStr = String(fecha);

    if (dateStr.includes("T")) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const d = String(date.getDate()).padStart(2, "0");
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
      }
    }

    if (dateStr.includes("-")) {
      const [y, m, d] = dateStr.split("-");
      return `${d}/${m}/${y}`;
    }

    return dateStr;
  };

  const formatFechaHora = (fecha?: string | null) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleString("es-AR");
  };

  if (isLoading) return <p className="text-slate-500">Cargando...</p>;
  if (isError || !data) {
    return <p className="text-slate-500">No se encontro la participacion.</p>;
  }

  const isDeleted = !!data.deleted_at;

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold leading-none md:text-3xl">
              {data.nombre_evento || "-"}
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
            <Button
              size="sm"
              onClick={() =>
                navigate(`/participaciones/${participacionId}/editar`)
              }
            >
              Editar
            </Button>
          )}
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="space-y-2 text-sm text-slate-500 md:text-base">
            <p>
              <span className="font-medium text-slate-700">Nombre del evento:</span>{" "}
              {data.nombre_evento || "-"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Investigador:</span>{" "}
              {data.investigador || "-"}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Forma de participacion:
              </span>{" "}
              {FORMA_PARTICIPACION_LABELS[data.forma_participacion] ||
                data.forma_participacion ||
                "-"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Fecha:</span>{" "}
              {formatFecha(data.fecha)}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-700">Auditoria</h3>
            <p className="mt-1 text-xs text-slate-500">
              {data.nombre_evento || "-"}
            </p>
          </div>

          <div className="space-y-2 text-sm text-slate-500 md:text-base">
            <p>
              <span className="font-medium text-slate-700">Creado por:</span>{" "}
              {data.created_by_nombre || auditoria.nombreCreador}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Fecha de creacion:
              </span>{" "}
              {formatFechaHora(data.created_at)}
            </p>

            <p>
              <span className="font-medium text-slate-700">Eliminado por:</span>{" "}
              {data.deleted_by_nombre || auditoria.nombreEliminador}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Fecha de eliminacion:
              </span>{" "}
              {formatFechaHora(data.deleted_at)}
            </p>
          </div>
        </article>

        <HistorialCambiosCard
          subtitle={data.nombre_evento || "-"}
          items={historialCambios}
          isLoading={isLoadingHistorial}
          updatedAt={data.updated_at}
          updatedByName={data.updated_by_nombre}
          formatItemValue={(item, value) => {
            if (item.campo === "forma_participacion") {
              const key = typeof value === "string" ? value : "";
              return FORMA_PARTICIPACION_LABELS[key] || key || "-";
            }

            if (item.campo === "investigador_id") {
              if (value === null || value === undefined || value === "") return "-";
              const idValue = Number(value);
              return (
                investigadoresMap.get(idValue) ||
                (idValue === data.investigador_id ? data.investigador || "-" : `ID ${idValue}`)
              );
            }

            return value === null || value === undefined || value === ""
              ? "-"
              : String(value);
          }}
        />

        <div className="flex justify-start pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigateBackFromMemoriaContext(navigate, location, "/participaciones")
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
