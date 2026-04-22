import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Button from "@/components/Button";
import SuccessToast from "@/components/SuccessToast";
import {
  getTransferenciaById,
  type Transferencia,
} from "@/services/transferenciasServices";
import { useAuditoria } from "@/hooks/useAuditoria";
import { useAuth } from "@/context/AuthContext";

const formatFecha = (fecha?: string | null) => {
  if (!fecha) return "—";

  const [y, m, d] = fecha.split("-");
  if (!y || !m || !d) return fecha;

  return `${d}/${m}/${y}`;
};

const formatMonto = (monto?: number | null) =>
  typeof monto === "number"
    ? monto.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
      })
    : "—";

export default function TransferenciasDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { canEditRecords } = useAuth();

  const puedeEditar = canEditRecords();

  const { data, isLoading, isError } = useQuery<Transferencia | null>({
    queryKey: ["transferencias", id],
    queryFn: () => getTransferenciaById(Number(id)),
    enabled: !!id,
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const auditoria = useAuditoria(data);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const formatFechaHora = (fecha?: string | null) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleString("es-AR");
  };

  if (isLoading) {
    return <p className="text-slate-500">Cargando…</p>;
  }

  if (isError || !data) {
    return <p className="text-slate-500">No se encontró la transferencia.</p>;
  }

  const isDeleted = data.activo === false || !!data.deletedAt;
  const titulo = data.denominacion || data.descripcionActividad || "—";

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl font-semibold leading-none">
              {titulo}
            </h2>

            <span
              className={`w-fit px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider border ${
                isDeleted
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isDeleted ? "INACTIVA" : "ACTIVA"}
            </span>
          </div>

          {puedeEditar && !isDeleted && (
            <Button
              size="sm"
              onClick={() => navigate(`/transferencias/${data.id}/editar`)}
            >
              Editar
            </Button>
          )}
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="space-y-3 text-sm md:text-base text-slate-500">
            <p>
              <span className="font-medium text-slate-700">
                Número de transferencia:
              </span>{" "}
              {data.numeroTransferencia || "—"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Denominación:</span>{" "}
              {data.denominacion || "—"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Demandante:</span>{" "}
              {data.demandante || "—"}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Descripción de la actividad:
              </span>{" "}
              {data.descripcionActividad || "—"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Monto:</span>{" "}
              {formatMonto(data.monto)}
            </p>

            <p>
              <span className="font-medium text-slate-700">Fecha de inicio:</span>{" "}
              {formatFecha(data.fechaInicio)}
            </p>

            <p>
              <span className="font-medium text-slate-700">Fecha de fin:</span>{" "}
              {formatFecha(data.fechaFin)}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Tipo de contrato:
              </span>{" "}
              {data.tipoContrato || "—"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Grupo UTN:</span>{" "}
              {data.grupo || "—"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Adoptantes:</span>{" "}
              {data.adoptantes.length > 0
                ? data.adoptantes.map((a) => a.nombre).join(", ")
                : "—"}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-700">Auditoría</h3>
            <p className="text-xs text-slate-500 mt-1">{titulo}</p>
          </div>

          <div className="space-y-2 text-sm md:text-base text-slate-500">
            <p>
              <span className="font-medium text-slate-700">Creado por:</span>{" "}
              {data.created_by_nombre || auditoria.nombreCreador}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Fecha de creación:
              </span>{" "}
              {formatFechaHora(data.created_at)}
            </p>

            <p>
              <span className="font-medium text-slate-700">Eliminado por:</span>{" "}
              {data.deleted_by_nombre || auditoria.nombreEliminador}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Fecha de eliminación:
              </span>{" "}
              {formatFechaHora(data.deletedAt)}
            </p>
          </div>
        </article>

        <div className="flex justify-start pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/transferencias")}
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