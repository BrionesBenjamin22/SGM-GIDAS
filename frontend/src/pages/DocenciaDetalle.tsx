import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Button from "@/components/Button";
import { getActividadDocenciaById } from "@/services/actividadDocenciaServices";
import { getGradoAcademicoById } from "@/services/gradoAcademicoService";
import { getRolActividadById } from "@/services/rolActividadService";
import { useAuditoria } from "@/hooks/useAuditoria";
import { toTitleCase } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";

export default function ActividadDocenciaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEditRecords } = useAuth();

  const puedeEditar = canEditRecords();

  const { data, isLoading } = useQuery({
    queryKey: ["actividad-docencia", id],
    queryFn: () => getActividadDocenciaById(Number(id)),
    enabled: !!id,
  });

  const { data: gradoAcademico } = useQuery({
    queryKey: ["grado-academico", data?.grado_academico_id],
    queryFn: () => getGradoAcademicoById(Number(data?.grado_academico_id)),
    enabled: !!data?.grado_academico_id,
  });

  const { data: rolActividad } = useQuery({
    queryKey: ["rol-actividad", data?.rol_actividad_id],
    queryFn: () => getRolActividadById(Number(data?.rol_actividad_id)),
    enabled: !!data?.rol_actividad_id,
  });

  const auditoria = useAuditoria(data);

  if (isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (!data)
    return <p className="text-slate-500">No se encontró la actividad.</p>;

  const isDeleted = !!data.deleted_at;

  const formatFecha = (fecha?: string | null) => {
    if (!fecha) return "—";
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const formatFechaHora = (fecha?: string | null) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleString("es-AR");
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-semibold leading-none">
            {toTitleCase(data.curso) || "—"}
          </h2>

          <span
            className={`w-fit px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider border ${
              isDeleted
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {isDeleted ? "ELIMINADA" : "ACTIVA"}
          </span>
        </div>

        {puedeEditar && !isDeleted && (
          <Button
            size="sm"
            onClick={() => navigate(`/docenciaInvestigador/${id}/editar`)}
          >
            Editar
          </Button>
        )}
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="space-y-2 text-sm md:text-base text-slate-500">
          <p>
            <span className="font-medium text-slate-700">Investigador:</span>{" "}
            {toTitleCase(data.investigador) || "—"}
          </p>

          <p>
            <span className="font-medium text-slate-700">
              Fecha de inicio:
            </span>{" "}
            {formatFecha(data.fecha_inicio)}
          </p>

          <p>
            <span className="font-medium text-slate-700">
              Fecha de finalización:
            </span>{" "}
            {formatFecha(data.fecha_fin)}
          </p>

          <p>
            <span className="font-medium text-slate-700">
              Grado académico:
            </span>{" "}
            {toTitleCase(gradoAcademico?.nombre) || "—"}
          </p>

          <p>
            <span className="font-medium text-slate-700">Institución:</span>{" "}
            {toTitleCase(data.institucion) || "—"}
          </p>

          <p>
            <span className="font-medium text-slate-700">
              Rol en la actividad:
            </span>{" "}
            {toTitleCase(rolActividad?.nombre) || "—"}
          </p>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-700">Auditoría</h3>

          <p className="text-xs text-slate-500 mt-1">
            {toTitleCase(data.curso) || "—"} -{" "}
            {toTitleCase(data.investigador) || "—"}
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
            <span className="font-medium text-slate-700">Eliminado por:</span>{" "}
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
          onClick={() => navigate("/docenciaInvestigador")}
        >
          Volver
        </Button>
      </div>
    </section>
  );
}