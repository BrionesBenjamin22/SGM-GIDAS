import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import Button from "@/components/Button";
import SuccessToast from "@/components/SuccessToast";
import { useAuth } from "@/context/AuthContext";
import {
  exportarExcelMemoria,
  getActividadesDocenciaSnapshot,
  getArticulosDivulgacionSnapshot,
  getBecariosSnapshot,
  getDistincionesSnapshot,
  getDocumentacionBibliograficaSnapshot,
  getEquipamientoSnapshot,
  getErogacionesSnapshot,
  getInvestigadoresSnapshot,
  getMemoriaById,
  getParticipacionesRelevantesSnapshot,
  getPersonalSnapshot,
  getProyectosSnapshot,
  getRegistrosPropiedadSnapshot,
  getTrabajosReunionCientificaSnapshot,
  getTrabajosRevistasSnapshot,
  getTransferenciasSnapshot,
  getVisitasAcademicasSnapshot,
} from "@/services/memoriasService";
import { formatFecha } from "@/utils/formatFecha";

type SnapshotSection = {
  key: string;
  label: string;
  queryKey: string;
  queryFn: (memoriaId: number, versionId: number) => Promise<any[]>;
  homePath?: string;
};

const sections: SnapshotSection[] = [
  {
    key: "investigadores",
    label: "Investigadores",
    queryKey: "memoria-snapshot-investigadores",
    queryFn: getInvestigadoresSnapshot,
    homePath: "/personal?tipo=INVESTIGADOR",
  },
  {
    key: "becarios",
    label: "Becarios",
    queryKey: "memoria-snapshot-becarios",
    queryFn: getBecariosSnapshot,
    homePath: "/personal?tipo=BECARIO",
  },
  {
    key: "personal",
    label: "Personal",
    queryKey: "memoria-snapshot-personal",
    queryFn: getPersonalSnapshot,
    homePath: "/personal?tipo=PERSONAL",
  },
  {
    key: "proyectos",
    label: "Proyectos",
    queryKey: "memoria-snapshot-proyectos",
    queryFn: getProyectosSnapshot,
    homePath: "/proyectos",
  },
  {
    key: "actividades-docencia",
    label: "Actividades en docencia",
    queryKey: "memoria-snapshot-docencia",
    queryFn: getActividadesDocenciaSnapshot,
    homePath: "/docenciaInvestigador",
  },
  {
    key: "participaciones-relevantes",
    label: "Participaciones relevantes",
    queryKey: "memoria-snapshot-participaciones",
    queryFn: getParticipacionesRelevantesSnapshot,
    homePath: "/participaciones",
  },
  {
    key: "documentacion-bibliografica",
    label: "Documentacion bibliografica",
    queryKey: "memoria-snapshot-documentacion",
    queryFn: getDocumentacionBibliograficaSnapshot,
    homePath: "/documentacion",
  },
  {
    key: "equipamiento",
    label: "Equipamiento",
    queryKey: "memoria-snapshot-equipamiento",
    queryFn: getEquipamientoSnapshot,
    homePath: "/equipamiento",
  },
  {
    key: "erogaciones",
    label: "Erogaciones",
    queryKey: "memoria-snapshot-erogaciones",
    queryFn: getErogacionesSnapshot,
    homePath: "/erogaciones",
  },
  {
    key: "transferencias",
    label: "Transferencias",
    queryKey: "memoria-snapshot-transferencias",
    queryFn: getTransferenciasSnapshot,
    homePath: "/transferencias",
  },
  {
    key: "trabajos-reunion-cientifica",
    label: "Trabajos en reunion cientifica",
    queryKey: "memoria-snapshot-reunion",
    queryFn: getTrabajosReunionCientificaSnapshot,
    homePath: "/trabajos-reunion",
  },
  {
    key: "trabajos-revistas",
    label: "Trabajos en revistas",
    queryKey: "memoria-snapshot-revistas",
    queryFn: getTrabajosRevistasSnapshot,
    homePath: "/trabajos-revistas",
  },
  {
    key: "distinciones",
    label: "Distinciones",
    queryKey: "memoria-snapshot-distinciones",
    queryFn: getDistincionesSnapshot,
    homePath: "/distinciones",
  },
  {
    key: "registros-propiedad",
    label: "Registros de propiedad",
    queryKey: "memoria-snapshot-registros",
    queryFn: getRegistrosPropiedadSnapshot,
    homePath: "/registros-propiedad",
  },
  {
    key: "articulos-divulgacion",
    label: "Articulos de divulgacion",
    queryKey: "memoria-snapshot-articulos",
    queryFn: getArticulosDivulgacionSnapshot,
    homePath: "/articulos-divulgacion",
  },
  {
    key: "visitas-academicas",
    label: "Visitas academicas",
    queryKey: "memoria-snapshot-visitas",
    queryFn: getVisitasAcademicasSnapshot,
    homePath: "/visitantes",
  },
];

function buildMemoriaLabel(memoria: any) {
  const year = memoria?.periodo_fin ? new Date(memoria.periodo_fin).getFullYear() : "";
  return year ? `Memoria ${year}` : "Memoria";
}

const snapshotEntityIdKeys: Record<string, string> = {
  investigadores: "investigador_id",
  becarios: "becario_id",
  personal: "personal_id",
  proyectos: "proyecto_investigacion_id",
  "actividades-docencia": "actividad_docencia_id",
  "participaciones-relevantes": "participacion_relevante_id",
  "documentacion-bibliografica": "documentacion_bibliografica_id",
  equipamiento: "equipamiento_id",
  erogaciones: "erogacion_id",
  transferencias: "transferencia_id",
  "trabajos-reunion-cientifica": "trabajo_reunion_id",
  "trabajos-revistas": "trabajo_revista_id",
  distinciones: "distincion_id",
  "registros-propiedad": "registro_propiedad_id",
  "articulos-divulgacion": "articulo_divulgacion_id",
  "visitas-academicas": "visita_academica_id",
};

function getSnapshotEntityId(sectionKey: string, entry: any) {
  const mappedKey = snapshotEntityIdKeys[sectionKey];

  if (mappedKey && entry?.[mappedKey] !== undefined && entry?.[mappedKey] !== null) {
    return entry[mappedKey];
  }

  return entry?.id;
}

export default function MemoriaVersionDetalle() {
  const { id, versionId } = useParams<{ id: string; versionId: string }>();
  const navigate = useNavigate();
  const { isAdmin, isGestor } = useAuth();

  const memoriaId = Number(id);
  const memoriaVersionId = Number(versionId);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [message, setMessage] = useState("");

  const { data: memoria, isLoading: isLoadingMemoria } = useQuery({
    queryKey: ["memoria", id],
    queryFn: () => getMemoriaById(memoriaId),
    enabled: Number.isFinite(memoriaId),
  });

  const snapshotQueries = useQueries({
    queries: sections.map((section) => ({
      queryKey: [section.queryKey, memoriaId, memoriaVersionId],
      queryFn: () => section.queryFn(memoriaId, memoriaVersionId),
      enabled: Number.isFinite(memoriaId) && Number.isFinite(memoriaVersionId),
    })),
  });

  const isLoadingSnapshots = snapshotQueries.some((query) => query.isLoading);

  const sectionData = useMemo(
    () =>
      sections.map((section, index) => ({
        ...section,
        items: snapshotQueries[index].data || [],
      })),
    [snapshotQueries]
  );
  const versionActual = (memoria?.versiones || []).find(
    (version: any) => version.id === memoriaVersionId
  );
  const versionCerrada = versionActual?.estado === "cerrada";
  const sectionsWithItems = sectionData.filter((section) => section.items.length > 0);
  const numeroVersionMemoria = versionActual?.numero_version ?? memoriaVersionId;
  const puedeExportarExcel = versionCerrada && (isAdmin() || isGestor());

  const { mutate: descargarExcel, isPending: isExportingExcel } = useMutation({
    mutationFn: () => exportarExcelMemoria(memoriaId, memoriaVersionId),
    onSuccess: (result) => {
      setMessage(`Excel generado con exito: ${result.filename}`);
      setShowSuccess(true);
    },
    onError: (error) => {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo generar el Excel de la memoria."
      );
      setShowError(true);
    },
  });

  const handleNavigateToSection = (section: SnapshotSection) => {
    if (!section.homePath) return;

    const entries = sectionData.find((current) => current.key === section.key)?.items ?? [];
    const ids = entries
      .map((entry: any) => getSnapshotEntityId(section.key, entry))
      .filter((value: unknown) => value !== undefined && value !== null);

    navigate(section.homePath, {
      state: {
        memoriaFilter: {
          source: "memoria",
          sectionKey: section.key,
          sectionLabel: section.label,
          ids,
          memoriaLabel: buildMemoriaLabel(memoria),
          memoriaId,
          versionId: memoriaVersionId,
        },
      },
    });
  };

  if (isLoadingMemoria) {
    return <p className="text-slate-500">Cargando memoria...</p>;
  }

  if (!memoria) {
    return <p className="text-slate-500">No se encontro la memoria.</p>;
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold leading-none md:text-3xl">
            Elementos registrados
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Memoria {formatFecha(memoria.periodo_inicio)} - {formatFecha(memoria.periodo_fin)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Version {numeroVersionMemoria}</p>
        </div>

        <div className="flex items-center gap-2">
          {puedeExportarExcel && (
            <Button size="sm" onClick={() => descargarExcel()} disabled={isExportingExcel}>
              {isExportingExcel ? "Generando Excel..." : "Generar Excel"}
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/memorias/${memoria.id}`)}
          >
            Volver
          </Button>
        </div>
      </div>

      {isLoadingSnapshots ? (
        <p className="text-slate-500">Cargando elementos registrados...</p>
      ) : !versionCerrada ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Esta version aun no fue cerrada. Los elementos registrados estaran
            disponibles una vez generado el snapshot al cerrar la memoria.
          </div>

          <div className="flex justify-start">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/memorias/${memoria.id}`)}
            >
              Volver
            </Button>
          </div>
        </div>
      ) : sectionsWithItems.length === 0 ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-5 py-6 text-sm text-slate-500 shadow-sm">
            Esta version no contiene elementos registrados.
          </div>

          <div className="flex justify-start">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/memorias/${memoria.id}`)}
            >
              Volver
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectionsWithItems.map((section) => (
              <article
                key={section.key}
                className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {section.label}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                      {section.items.length} registrados
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                      section.items.length > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {section.items.length > 0 ? "Disponible" : "Sin datos"}
                  </span>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Cantidad registrada
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-slate-800">
                      {section.items.length}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Esta seccion aporta {section.items.length} elemento
                      {section.items.length === 1 ? "" : "s"} al snapshot de esta
                      version.
                    </p>
                  </div>
                </div>

                {section.items.length > 0 && section.homePath && (
                  <button
                    type="button"
                    onClick={() => handleNavigateToSection(section)}
                    className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Ver registros en el modulo
                  </button>
                )}
              </article>
            ))}
          </div>

          <div className="flex justify-start">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/memorias/${memoria.id}`)}
            >
              Volver
            </Button>
          </div>
        </div>
      )}

      <SuccessToast
        open={showSuccess}
        message={message}
        onClose={() => setShowSuccess(false)}
      />

      <SuccessToast
        open={showError}
        message={message}
        onClose={() => setShowError(false)}
        variant="error"
      />
    </section>
  );
}
