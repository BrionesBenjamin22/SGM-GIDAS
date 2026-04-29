import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Button from "@/components/Button";
import HistorialCambiosCard from "@/components/HistorialCambiosCard";
import SuccessToast from "@/components/SuccessToast";
import {
  getTransferenciaById,
  getHistorialTransferenciaById,
  type Transferencia,
} from "@/services/transferenciasServices";
import { useAuditoria } from "@/hooks/useAuditoria";
import { useAuth } from "@/context/AuthContext";
import { formatFecha } from "@/utils/formatFecha";

const formatMonto = (monto?: number | null) =>
  typeof monto === "number"
    ? monto.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
      })
    : "-";

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
    refetchOnMount: "always",
  });

  const { data: historialCambios = [], isLoading: isLoadingHistorial } = useQuery({
    queryKey: ["transferencia-historial", id],
    queryFn: () => getHistorialTransferenciaById(Number(id)),
    enabled: !!id,
    refetchOnMount: "always",
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const auditoria = useAuditoria(data);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const formatFechaHora = (fecha?: string | null) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleString("es-AR");
  };

  if (isLoading) {
    return <p className="text-slate-500">Cargando...</p>;
  }

  if (isError || !data) {
    return <p className="text-slate-500">No se encontro la transferencia.</p>;
  }

  const isDeleted = data.activo === false || !!data.deletedAt;
  const titulo = data.denominacion || data.descripcionActividad || "-";

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold leading-none md:text-3xl">
              {titulo}
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
            <Button size="sm" onClick={() => navigate(`/transferencias/${data.id}/editar`)}>
              Editar
            </Button>
          )}
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="space-y-2 text-sm text-slate-500 md:text-base">
            <p>
              <span className="font-medium text-slate-700">Numero de transferencia:</span>{" "}
              {data.numeroTransferencia || "-"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Denominacion:</span>{" "}
              {data.denominacion || "-"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Demandante:</span>{" "}
              {data.demandante || "-"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Descripcion de la actividad:</span>{" "}
              {data.descripcionActividad || "-"}
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
              <span className="font-medium text-slate-700">Tipo de contrato:</span>{" "}
              {data.tipoContrato || "-"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Grupo UTN:</span>{" "}
              {data.grupo || "-"}
            </p>

            <p>
              <span className="font-medium text-slate-700">Adoptantes:</span>{" "}
              {data.adoptantes.length > 0
                ? data.adoptantes.map((adoptante) => adoptante.nombre).join(", ")
                : "-"}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-700">Auditoria</h3>
            <p className="mt-1 text-xs text-slate-500">{titulo}</p>
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
              <span className="font-medium text-slate-700">Fecha de eliminacion:</span>{" "}
              {formatFechaHora(data.deletedAt)}
            </p>
          </div>
        </article>

        <HistorialCambiosCard
          subtitle={titulo}
          items={historialCambios}
          isLoading={isLoadingHistorial}
          updatedAt={data.updated_at}
          updatedByName={data.updated_by_nombre}
          formatItemValue={(item, value) => {
            if (value === null || value === undefined || value === "") return "-";

            if (item.campo === "monto") {
              return formatMonto(Number(value));
            }

            if (item.campo === "fecha_inicio" || item.campo === "fecha_fin") {
              return formatFecha(String(value));
            }

            if (item.campo === "tipo_contrato_id") {
              const idValue = Number(value);
              return idValue === data.tipoContratoId
                ? data.tipoContrato || `ID ${idValue}`
                : `ID ${idValue}`;
            }

            if (item.campo === "grupo_utn_id") {
              const idValue = Number(value);
              return idValue === data.grupoUtnId
                ? data.grupo || `ID ${idValue}`
                : `ID ${idValue}`;
            }

            if (item.campo === "adoptantes") {
              if (
                typeof value === "object" &&
                value !== null &&
                "detalle" in value &&
                typeof (value as { detalle?: unknown }).detalle === "object" &&
                (value as { detalle?: unknown }).detalle !== null &&
                "nombre" in ((value as { detalle: { nombre?: string } }).detalle)
              ) {
                return String(
                  (value as { detalle: { nombre?: string } }).detalle.nombre || "-"
                );
              }

              if (Array.isArray(value)) {
                const nombres = value
                  .map((entry) => {
                    if (typeof entry === "string") {
                      return entry
                        .replace(/^vincular:\s*/i, "")
                        .replace(/^desvincular:\s*/i, "");
                    }

                    if (typeof entry === "object" && entry !== null && "nombre" in entry) {
                      return String((entry as { nombre?: string }).nombre || "");
                    }

                    return "";
                  })
                  .filter(Boolean);

                return nombres.length > 0 ? nombres.join(", ") : "-";
              }

              if (typeof value === "string") {
                return value.replace(/^vincular:\s*/i, "").replace(/^desvincular:\s*/i, "");
              }

              if (typeof value === "object" && value !== null && "nombre" in value) {
                return String((value as { nombre?: string }).nombre || "-");
              }
            }

            return String(value);
          }}
        />

        <div className="flex justify-start pt-4">
          <Button variant="secondary" size="sm" onClick={() => navigate("/transferencias")}>
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
