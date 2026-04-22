import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import SuccessToast from "@/components/SuccessToast";
import { getParticipacionById } from "@/services/participacionesServices";
import { useAuditoria } from "@/hooks/useAuditoria";
import { toTitleCase } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";

const FORMA_PARTICIPACION_LABELS: Record<string, string> = {
  jurado: "Jurado",
  evaluador: "Evaluador",
  panelista: "Panelista",
  comite: "Miembro de comité científico",
};

export default function ParticipacionesDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { canEditRecords } = useAuth();

  const puedeEditar = canEditRecords();

  const participacionId = id ? Number(id) : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["participacion", participacionId],
    queryFn: () => getParticipacionById(participacionId as number),
    enabled: !!participacionId,
  });

  const auditoria = useAuditoria(data);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const formatFecha = (fecha?: string | Date | null) => {
    if (!fecha) return "—";

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
    if (!fecha) return "—";
    return new Date(fecha).toLocaleString("es-AR");
  };

  if (isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (isError || !data) {
    return <p className="text-slate-500">No se encontró la participación.</p>;
  }

  const isDeleted = !!data.deleted_at;

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl font-semibold leading-none">
              {toTitleCase(data.nombre_evento) || "—"}
            </h2>

            <span
              className={`w-fit px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider border ${
                isDeleted
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
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
          <div className="space-y-2 text-sm md:text-base text-slate-500">
            <p>
              <span className="font-medium text-slate-700">
                Nombre del evento:
              </span>{" "}
              {toTitleCase(data.nombre_evento) || "—"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Investigador:</span>{" "}
              {toTitleCase(data.investigador) || "—"}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Forma de participación:
              </span>{" "}
              {FORMA_PARTICIPACION_LABELS[data.forma_participacion] ||
                data.forma_participacion ||
                "—"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Fecha:</span>{" "}
              {formatFecha(data.fecha)}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-700">
              Auditoría
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {toTitleCase(data.nombre_evento) || "—"}
            </p>
          </div>

          <div className="space-y-2 text-sm md:text-base text-slate-500">
            <p>
              <span className="font-medium text-slate-700">Creado por:</span>{" "}
              {auditoria.nombreCreador}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Fecha de creación:
              </span>{" "}
              {formatFechaHora(data.created_at)}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Eliminado por:
              </span>{" "}
              {auditoria.nombreEliminador}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Fecha de eliminación:
              </span>{" "}
              {formatFechaHora(data.deleted_at)}
            </p>
          </div>
        </article>

        <div className="flex justify-start pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/participaciones")}
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