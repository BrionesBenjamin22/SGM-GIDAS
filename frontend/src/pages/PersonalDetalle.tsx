import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Button from "@/components/Button";
import SuccessToast from "@/components/SuccessToast";
import { getPersonalCompletoByRolAndId } from "@/services/personalCompletoServices";
import { useAuditoria } from "@/hooks/useAuditoria";
import { useAuth } from "@/context/AuthContext";

export default function PersonalDetalle() {
  const { rol: paramRol, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { canEditRecords } = useAuth();

  const puedeEditar = canEditRecords();

  const rol = (() => {
    if (paramRol) return paramRol;
    const path = location.pathname;
    if (path.includes("/becarios/")) return "becario";
    if (path.includes("/investigadores/")) return "investigador";
    if (path.includes("/ptaa/")) return "personal";
    if (path.includes("/profesionales/")) return "profesional";
    return undefined;
  })();

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showHistorialHoras, setShowHistorialHoras] = useState(false);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["personal-detalle", rol, id],
    queryFn: () => getPersonalCompletoByRolAndId(rol!, Number(id)),
    enabled: !!rol && !!id,
  });

  const auditoria = useAuditoria(data);

  if (isLoading) {
    return <p className="text-slate-500">Cargando…</p>;
  }

  if (isError || !data) {
    return <p className="text-slate-500">No se encontró el registro.</p>;
  }

  const relaciones = data.relaciones || {};
  const isInactive = !!data.deleted_at || data.activo === false;

  const formatearLabel = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const renderArray = (arr: any[]) => {
    if (!arr || arr.length === 0) return null;
    return arr
      .map((v) => v.nombre_apellido || v.nombre || v.titulo || "")
      .filter(Boolean)
      .join(", ");
  };

  const formatFechaHora = (fecha?: string | null) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleString("es-AR");
  };

  const formatFecha = (fecha?: string | null) => {
    if (!fecha) return "Actual";
    const d = new Date(`${fecha}T00:00:00`);
    return d.toLocaleDateString("es-AR");
  };

  const getRolLabel = () => {
    if (rol === "personal") return "PTAA";
    if (rol === "profesional") return "Profesional";
    if (rol === "investigador") return "Investigador";
    if (rol === "becario") return "Becario";
    return rol ?? "—";
  };

  const handleEditar = () => {
    if (rol === "becario") navigate(`/becarios/${id}/editar`);
    else if (rol === "investigador") navigate(`/investigadores/${id}/editar`);
    else navigate(`/personal/${rol}/${id}/editar`);
  };

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl font-semibold leading-none">
              {data.nombre_apellido ?? "Detalle"}
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              {rol && (
                <span className="w-fit px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider border border-slate-200">
                  {getRolLabel()}
                </span>
              )}

              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  isInactive
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isInactive ? "INACTIVO" : "ACTIVO"}
              </span>
            </div>
          </div>

          {puedeEditar && !isInactive && (
            <Button size="sm" onClick={handleEditar}>
              Editar
            </Button>
          )}
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="space-y-2 text-sm md:text-base text-slate-500">
            {relaciones.tipo_personal?.nombre && (
              <p>
                <span className="font-medium text-slate-700">
                  Tipo de Personal:
                </span>{" "}
                {relaciones.tipo_personal.nombre}
              </p>
            )}

            {relaciones.tipo_formacion?.nombre && (
              <p>
                <span className="font-medium text-slate-700">
                  Grado de Formación:
                </span>{" "}
                {relaciones.tipo_formacion.nombre}
              </p>
            )}

            {relaciones.categoria_utn?.nombre && (
              <p>
                <span className="font-medium text-slate-700">
                  Categoría UTN:
                </span>{" "}
                {relaciones.categoria_utn.nombre}
              </p>
            )}

            {relaciones.programa_incentivos?.nombre && (
              <p>
                <span className="font-medium text-slate-700">
                  Programa de Incentivos:
                </span>{" "}
                {relaciones.programa_incentivos.nombre}
              </p>
            )}

            {relaciones.tipo_dedicacion?.nombre && (
              <p>
                <span className="font-medium text-slate-700">
                  Tipo de Dedicación:
                </span>{" "}
                {relaciones.tipo_dedicacion.nombre}
              </p>
            )}

            {relaciones.proyectos?.length > 0 && (
              <p>
                <span className="font-medium text-slate-700">Proyectos:</span>{" "}
                {renderArray(relaciones.proyectos)}
              </p>
            )}

            {relaciones.actividades_docencia?.length > 0 && (
              <p>
                <span className="font-medium text-slate-700">
                  Actividades de Docencia:
                </span>{" "}
                {renderArray(relaciones.actividades_docencia)}
              </p>
            )}

            {relaciones.trabajos_reunion_cientifica?.length > 0 && (
              <p>
                <span className="font-medium text-slate-700">
                  Trabajos en Reunión Científica:
                </span>{" "}
                {renderArray(relaciones.trabajos_reunion_cientifica)}
              </p>
            )}

            {relaciones.participaciones_relevantes?.length > 0 && (
              <p>
                <span className="font-medium text-slate-700">
                  Participaciones Relevantes:
                </span>{" "}
                {renderArray(relaciones.participaciones_relevantes)}
              </p>
            )}

            {"horas_semanales" in data && (
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">
                    Horas Semanales:
                  </span>
                  {data.horas_semanales}
                  {Array.isArray(data.historial_horas) &&
                    data.historial_horas.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowHistorialHoras((prev) => !prev)}
                        className="text-slate-500 hover:text-slate-800 text-sm transition-colors"
                        title="Ver historial de horas"
                      >
                        Ver historial
                      </button>
                    )}
                </p>

                {showHistorialHoras &&
                  Array.isArray(data.historial_horas) &&
                  data.historial_horas.length > 0 && (
                    <div className="ml-4 border-l border-slate-200 pl-4 text-sm text-slate-600 space-y-1">
                      {data.historial_horas.map((h: any) => (
                        <p key={h.id}>
                          {h.horas_semanales} hs — {formatFecha(h.fecha_inicio)}{" "}
                          → {formatFecha(h.fecha_fin)}
                        </p>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {Array.isArray(data.becas) && (
              <div className="flex flex-col gap-2">
                <p>
                  <span className="font-medium text-slate-700">Becas:</span>{" "}
                  {data.becas.length === 0 ? "No percibe beca" : ""}
                </p>

                {data.becas.length > 0 && (
                  <div className="ml-4 border-l border-slate-200 pl-4 text-sm text-slate-600 space-y-2">
                    {data.becas.map((b: any, index: number) => (
                      <div key={b.id ?? index}>
                        <p>
                          <span className="font-medium text-slate-700">
                            {b.nombre_beca}
                          </span>
                        </p>
                        <p>
                          {formatFecha(b.fecha_inicio)} →{" "}
                          {formatFecha(b.fecha_fin)}
                        </p>
                        <p>
                          Monto percibido:{" "}
                          {b.monto_percibido !== null &&
                          b.monto_percibido !== undefined
                            ? b.monto_percibido
                            : "—"}
                        </p>
                        {b.descripcion && <p>{b.descripcion}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {Object.entries(data)
              .filter(
                ([key, value]) =>
                  ![
                    "id",
                    "nombre_apellido",
                    "activo",
                    "rol",
                    "relaciones",
                    "grupo",
                    "created_by",
                    "deleted_by",
                    "created_by_nombre",
                    "deleted_by_nombre",
                    "created_at",
                    "deleted_at",
                    "historial_horas",
                    "horas_semanales",
                    "becas",
                  ].includes(key) &&
                  value !== null &&
                  typeof value !== "object"
              )
              .map(([key, value]) => {
                if (key.endsWith("_id")) {
                  const relacionKey = key.replace("_id", "");
                  const nombreRelacion = relaciones?.[relacionKey]?.nombre;

                  if (nombreRelacion) {
                    return (
                      <p key={key}>
                        <span className="font-medium text-slate-700">
                          {formatearLabel(relacionKey)}:
                        </span>{" "}
                        {nombreRelacion}
                      </p>
                    );
                  }
                  return null;
                }

                return (
                  <p key={key}>
                    <span className="font-medium text-slate-700">
                      {formatearLabel(key)}:
                    </span>{" "}
                    {String(value) ?? "—"}
                  </p>
                );
              })}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-700">Auditoría</h3>
            <p className="text-xs text-slate-500 mt-1">{data.nombre_apellido}</p>
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
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
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