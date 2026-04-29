import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import Button from "@/components/Button";
import {
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
    homePath: "/personal",
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

function pickValue(item: any, keys: string[]) {
  for (const key of keys) {
    const value = item?.[key];
    const isRenderable =
      typeof value === "string" || typeof value === "number";

    if (isRenderable && String(value).trim()) {
      return String(value);
    }
  }

  return "";
}

function getEntryPreview(sectionKey: string, item: any) {
  switch (sectionKey) {
    case "investigadores":
    case "becarios":
    case "personal":
      return {
        title: pickValue(item, ["nombre_apellido"]),
        subtitle: pickValue(item, ["rol", "tipo_personal", "tipo_formacion"]),
      };
    case "proyectos":
      return {
        title: pickValue(item, ["nombre_proyecto", "codigo_proyecto"]),
        subtitle: pickValue(item, ["codigo_proyecto", "tipo_proyecto"]),
      };
    case "actividades-docencia":
      return {
        title: pickValue(item, ["curso"]),
        subtitle: pickValue(item, ["investigador", "institucion", "rol_actividad"]),
      };
    case "participaciones-relevantes":
      return {
        title: pickValue(item, ["nombre_evento"]),
        subtitle: pickValue(item, ["investigador", "forma_participacion"]),
      };
    case "documentacion-bibliografica":
      return {
        title: pickValue(item, ["titulo"]),
        subtitle: pickValue(item, ["editorial"]),
      };
    case "equipamiento":
      return {
        title: pickValue(item, ["denominacion"]),
        subtitle: pickValue(item, ["descripcion_breve"]),
      };
    case "erogaciones":
      return {
        title: pickValue(item, ["numero_erogacion"])
          ? `Erogacion Nro ${String(item.numero_erogacion).padStart(6, "0")}`
          : "Erogacion",
        subtitle:
          pickValue(item, ["tipo_erogacion_nombre", "tipo_erogacion"]) ||
          "Resumen financiero",
      };
    case "transferencias":
      return {
        title: pickValue(item, ["denominacion", "descripcion_actividad"]),
        subtitle: pickValue(item, ["demandante", "tipo_contrato"]),
      };
    case "trabajos-reunion-cientifica":
      return {
        title: pickValue(item, ["titulo_trabajo"]),
        subtitle: pickValue(item, ["nombre_reunion", "procedencia"]),
      };
    case "trabajos-revistas":
      return {
        title: pickValue(item, ["titulo_trabajo"]),
        subtitle: pickValue(item, ["nombre_revista", "editorial"]),
      };
    case "distinciones":
      return {
        title: pickValue(item, ["descripcion"]),
        subtitle: pickValue(item, ["proyecto_nombre", "proyecto"]),
      };
    case "registros-propiedad":
      return {
        title: pickValue(item, ["nombre_articulo"]),
        subtitle: pickValue(item, ["tipo_registro", "organismo_registrante"]),
      };
    case "articulos-divulgacion":
      return {
        title: pickValue(item, ["titulo"]),
        subtitle: pickValue(item, ["descripcion", "grupo_utn_nombre"]),
      };
    case "visitas-academicas":
      return {
        title: pickValue(item, ["razon", "tipo_visita"]),
        subtitle: pickValue(item, ["procedencia", "tipo_visita"]),
      };
    default:
      return {
        title: pickValue(item, [
          "nombre_apellido",
          "nombre_proyecto",
          "titulo_trabajo",
          "titulo",
          "denominacion",
          "descripcion",
        ]),
        subtitle: "",
      };
  }
}

function buildMemoriaLabel(memoria: any) {
  const year = memoria?.periodo_fin ? new Date(memoria.periodo_fin).getFullYear() : "";
  return year ? `Memoria ${year}` : "Memoria";
}

export default function MemoriaVersionDetalle() {
  const { id, versionId } = useParams<{ id: string; versionId: string }>();
  const navigate = useNavigate();

  const memoriaId = Number(id);
  const memoriaVersionId = Number(versionId);

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

  const handleNavigateToSection = (section: SnapshotSection) => {
    if (!section.homePath) return;

    const entries = sectionData.find((current) => current.key === section.key)?.items ?? [];
    const ids = entries
      .map((entry: any) => entry?.id)
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
          <p className="mt-1 text-xs text-slate-500">Version {memoriaVersionId}</p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/memorias/${memoria.id}`)}
        >
          Volver
        </Button>
      </div>

      {isLoadingSnapshots ? (
        <p className="text-slate-500">Cargando elementos registrados...</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectionData.map((section) => (
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
                  {section.items.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Esta seccion no contiene registros en esta version.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm text-slate-600">
                      {section.items.slice(0, 3).map((entry: any, index: number) => {
                        const preview = getEntryPreview(section.key, entry);
                        return (
                          <li key={`${section.key}-${index}`}>
                            <button
                              type="button"
                              onClick={() => handleNavigateToSection(section)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-slate-300 hover:bg-slate-100"
                            >
                              <p className="text-sm font-medium text-slate-800">
                                {preview.title || "Registro"}
                              </p>
                              {preview.subtitle && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {preview.subtitle}
                                </p>
                              )}
                            </button>
                          </li>
                        );
                      })}
                      {section.items.length > 3 && (
                        <li className="pt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                          Y {section.items.length - 3} mas
                        </li>
                      )}
                    </ul>
                  )}
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
    </section>
  );
}
