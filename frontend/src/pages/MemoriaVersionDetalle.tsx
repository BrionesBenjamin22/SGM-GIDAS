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
};

const sections: SnapshotSection[] = [
  {
    key: "investigadores",
    label: "Investigadores",
    queryKey: "memoria-snapshot-investigadores",
    queryFn: getInvestigadoresSnapshot,
  },
  {
    key: "becarios",
    label: "Becarios",
    queryKey: "memoria-snapshot-becarios",
    queryFn: getBecariosSnapshot,
  },
  {
    key: "personal",
    label: "Personal",
    queryKey: "memoria-snapshot-personal",
    queryFn: getPersonalSnapshot,
  },
  {
    key: "proyectos",
    label: "Proyectos",
    queryKey: "memoria-snapshot-proyectos",
    queryFn: getProyectosSnapshot,
  },
  {
    key: "actividades-docencia",
    label: "Actividades en docencia",
    queryKey: "memoria-snapshot-docencia",
    queryFn: getActividadesDocenciaSnapshot,
  },
  {
    key: "participaciones-relevantes",
    label: "Participaciones relevantes",
    queryKey: "memoria-snapshot-participaciones",
    queryFn: getParticipacionesRelevantesSnapshot,
  },
  {
    key: "documentacion-bibliografica",
    label: "Documentacion bibliografica",
    queryKey: "memoria-snapshot-documentacion",
    queryFn: getDocumentacionBibliograficaSnapshot,
  },
  {
    key: "equipamiento",
    label: "Equipamiento",
    queryKey: "memoria-snapshot-equipamiento",
    queryFn: getEquipamientoSnapshot,
  },
  {
    key: "erogaciones",
    label: "Erogaciones",
    queryKey: "memoria-snapshot-erogaciones",
    queryFn: getErogacionesSnapshot,
  },
  {
    key: "transferencias",
    label: "Transferencias",
    queryKey: "memoria-snapshot-transferencias",
    queryFn: getTransferenciasSnapshot,
  },
  {
    key: "trabajos-reunion-cientifica",
    label: "Trabajos en reunion cientifica",
    queryKey: "memoria-snapshot-reunion",
    queryFn: getTrabajosReunionCientificaSnapshot,
  },
  {
    key: "trabajos-revistas",
    label: "Trabajos en revistas",
    queryKey: "memoria-snapshot-revistas",
    queryFn: getTrabajosRevistasSnapshot,
  },
  {
    key: "distinciones",
    label: "Distinciones",
    queryKey: "memoria-snapshot-distinciones",
    queryFn: getDistincionesSnapshot,
  },
  {
    key: "registros-propiedad",
    label: "Registros de propiedad",
    queryKey: "memoria-snapshot-registros",
    queryFn: getRegistrosPropiedadSnapshot,
  },
  {
    key: "articulos-divulgacion",
    label: "Articulos de divulgacion",
    queryKey: "memoria-snapshot-articulos",
    queryFn: getArticulosDivulgacionSnapshot,
  },
  {
    key: "visitas-academicas",
    label: "Visitas academicas",
    queryKey: "memoria-snapshot-visitas",
    queryFn: getVisitasAcademicasSnapshot,
  },
];

function summarizeItem(item: any) {
  if (!item || typeof item !== "object") return "-";

  const candidateKeys = [
    "nombre_apellido",
    "nombre_proyecto",
    "codigo_proyecto",
    "titulo_trabajo",
    "titulo",
    "denominacion",
    "descripcion",
    "nombre_revista",
    "nombre_reunion",
    "demandante",
    "tipo_personal",
    "tipo_visita",
  ];

  for (const key of candidateKeys) {
    if (item[key]) return String(item[key]);
  }

  const firstString = Object.values(item).find(
    (value) => typeof value === "string" && value.trim()
  );

  return firstString ? String(firstString) : "-";
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
                    {section.items.slice(0, 3).map((entry: any, index: number) => (
                      <li key={`${section.key}-${index}`} className="flex gap-2">
                        <span className="mt-[2px] h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                        <span>{summarizeItem(entry)}</span>
                      </li>
                    ))}
                    {section.items.length > 3 && (
                      <li className="pt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                        Y {section.items.length - 3} mas
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
