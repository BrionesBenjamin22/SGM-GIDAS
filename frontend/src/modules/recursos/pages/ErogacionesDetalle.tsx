import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import HistorialCambiosCard from "@/components/HistorialCambiosCard";
import SuccessToast from "@/components/SuccessToast";
import {
  getErogacionById,
  getHistorialErogacionById,
  type Erogacion,
} from "@/modules/recursos/services/erogacionesServices";
import { useAuditoria } from "@/modules/shared/hooks/useAuditoria";
import { useAuth } from "@/context/AuthContext";
import { formatFecha } from "@/utils/formatFecha";
import {
  navigateBackFromMemoriaContext,
  stripSuccessMessageState,
} from "@/lib/memoriaNavigation";

const fmtMoney = (value?: number | null) =>
  typeof value === "number"
    ? new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 2,
      }).format(value)
    : "-";

export default function ErogacionesDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { canEditRecords } = useAuth();

  const puedeEditar = canEditRecords();

  const { data, isLoading, isError } = useQuery<Erogacion>({
    queryKey: ["erogaciones", id],
    queryFn: () => getErogacionById(Number(id)),
    enabled: !!id,
    refetchOnMount: "always",
  });

  const { data: historialCambios = [], isLoading: isLoadingHistorial } = useQuery({
    queryKey: ["erogacion-historial", id],
    queryFn: () => getHistorialErogacionById(Number(id)),
    enabled: !!id,
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

  if (isLoading) return <p className="text-slate-500">Cargando...</p>;
  if (isError || !data) {
    return <p className="text-slate-500">No se encontro la erogacion.</p>;
  }

  const formatFechaHora = (fecha?: string | null) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleString("es-AR");
  };

  const nroErogacionFmt = `Erogacion Nro ${String(data.numero_erogacion).padStart(6, "0")}`;
  const isDeleted = !!data.deleted_at;

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold leading-none md:text-3xl">
              {nroErogacionFmt}
            </h2>

            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                isDeleted
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {isDeleted ? "INACTIVA" : "ACTIVA"}
            </span>
          </div>

          {puedeEditar && !isDeleted && (
            <Button
              size="sm"
              onClick={() => navigate(`/erogaciones/${data.id}/editar`)}
            >
              Editar
            </Button>
          )}
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="space-y-2 text-sm text-slate-500 md:text-base">
            <p>
              <span className="font-medium text-slate-700">Fecha:</span>{" "}
              {formatFecha(data.fecha)}
            </p>

            <p>
              <span className="font-medium text-slate-700">Tipo de erogacion:</span>{" "}
              {data.tipo_erogacion?.nombre || "-"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Ingresos:</span>{" "}
              {fmtMoney(data.ingresos)}
            </p>

            <p>
              <span className="font-medium text-slate-700">Egresos:</span>{" "}
              {fmtMoney(data.egresos)}
            </p>

            <p>
              <span className="font-medium text-slate-700">
                Fuente de financiamiento:
              </span>{" "}
              {data.fuente?.nombre || "-"}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-700">Auditoria</h3>
            <p className="mt-1 text-xs text-slate-500">{nroErogacionFmt}</p>
          </div>

          <div className="space-y-2 text-sm text-slate-500 md:text-base">
            <p>
              <span className="font-medium text-slate-700">Creado por:</span>{" "}
              {data.created_by_nombre || auditoria.nombreCreador}
            </p>

            <p>
              <span className="font-medium text-slate-700">Fecha de creacion:</span>{" "}
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
          subtitle={nroErogacionFmt}
          items={historialCambios}
          isLoading={isLoadingHistorial}
          updatedAt={data.updated_at}
          updatedByName={data.updated_by_nombre}
          formatItemValue={(item, value) => {
            if (value === null || value === undefined || value === "") return "-";

            if (item.campo === "ingresos" || item.campo === "egresos") {
              return fmtMoney(Number(value));
            }

            if (item.campo === "fecha") {
              return formatFecha(String(value));
            }

            if (item.campo === "tipo_erogacion_id") {
              const idValue = Number(value);
              return idValue === data.tipo_erogacion?.id
                ? data.tipo_erogacion?.nombre || `ID ${idValue}`
                : `ID ${idValue}`;
            }

            if (item.campo === "fuente_financiamiento_id") {
              const idValue = Number(value);
              return idValue === data.fuente?.id
                ? data.fuente?.nombre || `ID ${idValue}`
                : `ID ${idValue}`;
            }

            if (item.campo === "grupo_utn_id") {
              const idValue = Number(value);
              return idValue === data.grupo?.id
                ? data.grupo?.nombre || `ID ${idValue}`
                : `ID ${idValue}`;
            }

            return String(value);
          }}
        />

        <div className="flex justify-start pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigateBackFromMemoriaContext(navigate, location, "/erogaciones")
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
