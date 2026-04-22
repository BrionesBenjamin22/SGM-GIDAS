import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import {
  getProyectoById,
  reabrirProyecto,
  type Proyecto,
} from "@/services/proyectosServices";
import { useAuditoria } from "@/hooks/useAuditoria";
import { useAuth } from "@/context/AuthContext";

export default function ProyectoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { canEditRecords } = useAuth();

  const puedeEditar = canEditRecords();

  const { data, isLoading } = useQuery<Proyecto | null>({
    queryKey: ["proyecto", id],
    queryFn: () =>
      id ? getProyectoById(Number(id)) : Promise.resolve(null),
    enabled: !!id,
  });

  const auditoria = useAuditoria(data);

  const reabrirMutation = useMutation({
    mutationFn: (proyectoId: string) => reabrirProyecto(proyectoId),
    onSuccess: async (_, proyectoId) => {
      await qc.invalidateQueries({ queryKey: ["proyectos"] });
      await qc.invalidateQueries({ queryKey: ["proyecto", proyectoId] });
    },
  });

  if (isLoading) return <p className="text-slate-500">Cargando…</p>;
  if (!data) return <p className="text-slate-500">No se encontró el proyecto.</p>;

  const formatFecha = (fecha?: string | null) => {
    if (!fecha) return "—";
    const date = new Date(`${fecha}T00:00:00`);
    return date.toLocaleDateString("es-AR");
  };

  const formatFechaHora = (fecha?: string | null) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleString("es-AR");
  };

  const coordinador =
    data.investigadores?.find((inv) => inv.es_coordinador)?.nombre_apellido || "—";

  const investigadores = data.investigadores?.length
    ? data.investigadores
        .filter((inv) => !inv.es_coordinador)
        .map((inv) => inv.nombre_apellido)
        .join(", ") || "—"
    : "—";

  const becarios = data.becarios?.length
    ? data.becarios.map((a) => a.nombre_apellido).join(", ")
    : "—";

  const estaCerrado = data.cerrado === true;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-semibold leading-none">
            {data.nombreProyecto}
          </h2>

          <span
            className={`w-fit px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider border ${
              estaCerrado
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {estaCerrado ? "Cerrado" : "Activo"}
          </span>
        </div>

        <div className="flex gap-2">
          {puedeEditar && estaCerrado && data.id ? (
            <Button
              size="sm"
              onClick={() => reabrirMutation.mutate(String(data.id))}
              disabled={reabrirMutation.isPending}
            >
              {reabrirMutation.isPending ? "Reabriendo..." : "Reabrir"}
            </Button>
          ) : null}

          {puedeEditar && !data.deleted_at && !estaCerrado ? (
            <Button
              size="sm"
              onClick={() => navigate(`/proyectos/editar/${data.id}`)}
            >
              Editar
            </Button>
          ) : null}
        </div>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="space-y-3 text-sm md:text-base text-slate-500">
          <p>
            <span className="font-medium text-slate-700">Código del proyecto:</span>{" "}
            {data.codigoProyecto}
          </p>

          <p>
            <span className="font-medium text-slate-700">Coordinador:</span>{" "}
            {coordinador}
          </p>

          <p>
            <span className="font-medium text-slate-700">Investigadores:</span>{" "}
            {investigadores}
          </p>

          <p>
            <span className="font-medium text-slate-700">Becarios:</span>{" "}
            {becarios}
          </p>

          <p>
            <span className="font-medium text-slate-700">Descripción:</span>{" "}
            {data.descripcionProyecto || "—"}
          </p>

          <p>
            <span className="font-medium text-slate-700">Dificultades del proyecto:</span>{" "}
            {data.dificultadesProyecto || "—"}
          </p>

          <p>
            <span className="font-medium text-slate-700">Tipo de proyecto:</span>{" "}
            {data.tipoProyectoNombre || "—"}
          </p>

          <p>
            <span className="font-medium text-slate-700">Fuente de financiamiento:</span>{" "}
            {data.fuenteFinanciamientoNombre || "—"}
          </p>

          <p>
            <span className="font-medium text-slate-700">Grupo UTN:</span>{" "}
            {data.grupoUtnNombre || "—"}
          </p>

          <p>
            <span className="font-medium text-slate-700">Planificación:</span>{" "}
            {data.planificacionDescripcion || "—"}
          </p>

          <p>
            <span className="font-medium text-slate-700">Monto destinado:</span>{" "}
            {data.montoDestinado !== undefined && data.montoDestinado !== null
              ? data.montoDestinado
              : "—"}
          </p>

          <p>
            <span className="font-medium text-slate-700">Fecha inicio:</span>{" "}
            {formatFecha(data.fechaInicio)}
          </p>

          <p>
            <span className="font-medium text-slate-700">Fecha fin:</span>{" "}
            {formatFecha(data.fechaFinalizacion)}
          </p>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-700">Auditoría</h3>
          <p className="text-xs text-slate-500 mt-1">{data.nombreProyecto}</p>
        </div>

        <div className="space-y-2 text-sm md:text-base text-slate-500">
          <p>
            <span className="font-medium text-slate-700">Creado por:</span>{" "}
            {auditoria.nombreCreador}
          </p>
          <p>
            <span className="font-medium text-slate-700">Fecha de creación:</span>{" "}
            {formatFechaHora(data.created_at)}
          </p>
          <p>
            <span className="font-medium text-slate-700">Eliminado por:</span>{" "}
            {auditoria.nombreEliminador}
          </p>
          <p>
            <span className="font-medium text-slate-700">Fecha de eliminación:</span>{" "}
            {formatFechaHora(data.deleted_at)}
          </p>
        </div>
      </article>

      <div className="flex justify-start pt-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
      </div>
    </section>
  );
}
