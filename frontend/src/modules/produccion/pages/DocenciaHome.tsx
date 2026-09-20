import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import MemoriaFilterBanner from "@/components/MemoriaFilterBanner";
import SuccessToast from "@/components/SuccessToast";
import Table, {
  TableActionButton,
  TableActions,
  TableFilterChip,
  TableRowActionButton,
  TableSearch,
  TableToolbar,
} from "@/components/Table";
import type { TableColumn, TableSortDirection } from "@/components/Table";
import TableFilterSelect from "@/components/TableFilterSelect";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/httpError";
import { applyMemoriaSectionFilter, getMemoriaSectionFilter } from "@/lib/memoriaSectionFilter";
import { buildMemoriaDetailState } from "@/lib/memoriaNavigation";
import {
  eliminarActividadDocencia,
  getActividadesDocencia,
  getHistorialActividadDocenciaById,
  type ActividadDocencia,
  type HistorialActividadDocenciaItem,
} from "@/modules/produccion/services/actividadDocenciaServices";
import { isVisibleActividadDocenciaHistoryItem } from "@/modules/produccion/utils/actividadDocenciaHistory";
import { formatFecha } from "@/utils/dateTime";
import { toTitleCase } from "@/utils/format";

const ITEMS_PER_PAGE = 9;
const HISTORY_PER_PAGE = 3;

type DocenciaSort = "curso" | "investigador" | "institucion" | "rol" | "grado" | "fecha_inicio" | "estado";
type DocenciaFilters = { curso?: string; institucion?: string; investigador?: string; grado?: string; rol?: string };

const historyLabels: Record<string, string> = {
  curso: "Curso",
  institucion: "Institución",
  fecha_inicio: "Fecha de inicio",
  fecha_fin: "Fecha de finalización",
  grado_academico_id: "Grado académico",
  rol_actividad_id: "Rol en la actividad",
};

function getInvestigadorNombre(item: ActividadDocencia) {
  return typeof item.investigador === "string" ? item.investigador : item.investigador?.nombre_apellido ?? "";
}

function getHistoryValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") {
    const record = value as { nombre?: string; grado_academico?: string };
    return record.nombre ?? record.grado_academico ?? "Dato actualizado";
  }
  return String(value);
}

function formatHistoryEntry(item: HistorialActividadDocenciaItem) {
  return {
    title: historyLabels[item.campo ?? ""] ?? "Cambio registrado",
    description: `${getHistoryValue(item.valor_anterior)} → ${getHistoryValue(item.valor_nuevo)}`,
  };
}

export default function DocenciaLanding() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { canCreateRecords, canEditRecords, canDeleteRecords } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"true" | "false" | "all">("true");
  const [filters, setFilters] = useState<DocenciaFilters>({});
  const [sort, setSort] = useState<DocenciaSort>("fecha_inicio");
  const [direction, setDirection] = useState<TableSortDirection>("desc");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<ActividadDocencia | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const memoriaFilter = useMemo(() => getMemoriaSectionFilter(location.state, "actividades-docencia"), [location.state]);
  const activos = memoriaFilter ? "all" : activeFilter;
  const actividades = useQuery({
    queryKey: ["docencia", "all", activos],
    queryFn: () => getActividadesDocencia(undefined, activos),
  });
  const scopedList = useMemo(() => applyMemoriaSectionFilter(actividades.data ?? [], memoriaFilter), [actividades.data, memoriaFilter]);

  const filterOptions = useMemo(() => {
    const values = {
      cursos: new Set<string>(), instituciones: new Set<string>(), investigadores: new Set<string>(),
      grados: new Set<string>(), roles: new Set<string>(),
    };
    scopedList.forEach((item) => {
      if (item.curso) values.cursos.add(toTitleCase(item.curso));
      if (item.institucion) values.instituciones.add(toTitleCase(item.institucion));
      if (getInvestigadorNombre(item)) values.investigadores.add(toTitleCase(getInvestigadorNombre(item)));
      if (item.grado_academico) values.grados.add(toTitleCase(item.grado_academico));
      if (item.rol_actividad) values.roles.add(toTitleCase(item.rol_actividad));
    });
    const options = (entries: Set<string>) => Array.from(entries).sort().map((value) => ({ value, label: value }));
    return {
      cursos: options(values.cursos), instituciones: options(values.instituciones), investigadores: options(values.investigadores),
      grados: options(values.grados), roles: options(values.roles),
    };
  }, [scopedList]);

  const filteredList = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    const matching = scopedList.filter((item) => {
      const curso = toTitleCase(item.curso);
      const institucion = toTitleCase(item.institucion);
      const investigador = toTitleCase(getInvestigadorNombre(item));
      const grado = toTitleCase(item.grado_academico);
      const rol = toTitleCase(item.rol_actividad);
      const matchesSearch = !query || [curso, institucion, investigador, grado, rol]
        .some((value) => value.toLocaleLowerCase("es").includes(query));
      return matchesSearch && (!filters.curso || curso === filters.curso)
        && (!filters.institucion || institucion === filters.institucion)
        && (!filters.investigador || investigador === filters.investigador)
        && (!filters.grado || grado === filters.grado) && (!filters.rol || rol === filters.rol);
    });
    const sortValue = (item: ActividadDocencia) => {
      switch (sort) {
        case "curso": return item.curso;
        case "investigador": return getInvestigadorNombre(item);
        case "institucion": return item.institucion;
        case "rol": return item.rol_actividad;
        case "grado": return item.grado_academico;
        case "estado": return item.deleted_at ? 1 : 0;
        default: return item.fecha_inicio;
      }
    };
    return [...matching].sort((left, right) => {
      const result = String(sortValue(left) ?? "").localeCompare(String(sortValue(right) ?? ""), "es", { numeric: true, sensitivity: "base" });
      return direction === "asc" ? result : -result;
    });
  }, [direction, filters, scopedList, search, sort]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const rows = useMemo(() => filteredList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [filteredList, page]);
  const expandedItem = expandedRow === null ? undefined : scopedList.find((item) => item.id === expandedRow);
  const history = useQuery({
    queryKey: ["actividad-docencia-historial", expandedItem?.id],
    queryFn: () => getHistorialActividadDocenciaById(expandedItem!.id),
    enabled: Boolean(expandedItem),
    staleTime: 5 * 60_000,
  });

  useEffect(() => { setPage(1); setExpandedRow(null); }, [activeFilter, direction, filters, memoriaFilter, search, sort]);
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  useEffect(() => {
    if (!location.state?.successMessage) return;
    setSuccessMessage(location.state.successMessage);
    navigate(location.pathname, { replace: true, state: { ...location.state, successMessage: undefined } });
  }, [location.pathname, location.state, navigate]);

  const confirmDelete = async () => {
    if (!pendingDelete || pendingDelete.deleted_at || !canDeleteRecords()) return;
    try {
      await eliminarActividadDocencia(pendingDelete.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["docencia"] }),
        queryClient.invalidateQueries({ queryKey: ["actividad-docencia", String(pendingDelete.id)] }),
        queryClient.invalidateQueries({ queryKey: ["actividad-docencia-historial", pendingDelete.id] }),
      ]);
      setPendingDelete(null);
      setExpandedRow(null);
      setSuccessMessage("Actividad en docencia eliminada con éxito.");
    } catch (error) {
      setPendingDelete(null);
      setErrorMessage(getErrorMessage(error, "Lo sentimos, no pudimos completar la operación. Intente nuevamente."));
    }
  };

  const columns = useMemo<TableColumn<ActividadDocencia>[]>(() => [
    { id: "curso", header: "Curso", sortable: true, render: (item) => <span className="font-medium text-slate-900">{toTitleCase(item.curso) || "—"}</span> },
    { id: "investigador", header: "Investigador", sortable: true, render: (item) => toTitleCase(getInvestigadorNombre(item)) || "—" },
    { id: "institucion", header: "Institución", sortable: true, priority: "secondary", render: (item) => toTitleCase(item.institucion) || "—" },
    { id: "rol", header: "Rol", sortable: true, priority: "secondary", render: (item) => toTitleCase(item.rol_actividad) || "—" },
    { id: "grado", header: "Grado", sortable: true, priority: "tertiary", render: (item) => toTitleCase(item.grado_academico) || "—" },
    { id: "fecha_inicio", header: "Inicio", sortable: true, priority: "tertiary", render: (item) => formatFecha(item.fecha_inicio) },
    { id: "estado", header: "Estado", sortable: true, render: (item) => {
      const active = !item.deleted_at;
      return <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${active ? "text-emerald-700" : "text-rose-700"}`}><span aria-hidden="true" className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-rose-500"}`} />{active ? "Activa" : "Inactiva"}</span>;
    } },
    { id: "acciones", header: "Acciones", align: "right", render: (item) => <TableActions>
      <TableRowActionButton action="view" aria-label={`Ver detalle de ${item.curso}`} onClick={() => navigate(`/docenciaInvestigador/${item.id}`, { state: buildMemoriaDetailState(location) })} />
      {!item.deleted_at && canEditRecords() && <TableRowActionButton action="edit" aria-label={`Editar ${item.curso}`} onClick={() => navigate(`/docenciaInvestigador/${item.id}/editar`)} />}
      {!item.deleted_at && canDeleteRecords() && <TableRowActionButton action="delete" aria-label={`Eliminar ${item.curso}`} onClick={() => setPendingDelete(item)} />}
    </TableActions> },
  ], [canDeleteRecords, canEditRecords, location, navigate]);

  const renderHistory = () => {
    if (history.isLoading) return <p role="status" aria-live="polite" className="text-sm text-slate-500">Cargando historial…</p>;
    if (history.isError) return <div role="alert" className="flex items-center gap-3 text-sm text-rose-700"><span>Lo sentimos, no pudimos recuperar el historial. Intente nuevamente.</span><TableActionButton onClick={() => history.refetch()}>Reintentar</TableActionButton></div>;
    const entries = (history.data ?? []).filter(isVisibleActividadDocenciaHistoryItem);
    if (!entries.length) return <p className="text-sm text-slate-500">No hay cambios registrados.</p>;
    const pages = Math.ceil(entries.length / HISTORY_PER_PAGE);
    const visible = entries.slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE);
    return <div><h3 className="mb-3 text-sm font-semibold text-slate-900">Historial de cambios</h3>
      <ul className="space-y-2">{visible.map((entry) => {
        const presentation = formatHistoryEntry(entry);
        return <li key={entry.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm"><span className="block font-medium text-slate-800">{presentation.title}</span><span className="mt-1 block text-slate-600">{presentation.description}</span>{entry.usuario_nombre && <span className="mt-1 block text-xs text-slate-500">Por {entry.usuario_nombre}</span>}</li>;
      })}</ul>
      {pages > 1 && <nav aria-label="Paginación del historial" className="mt-3 flex gap-2"><TableActionButton disabled={historyPage === 1} onClick={() => setHistoryPage((value) => value - 1)}>Anterior</TableActionButton><span className="self-center text-xs text-slate-500">Página {historyPage} de {pages}</span><TableActionButton disabled={historyPage === pages} onClick={() => setHistoryPage((value) => value + 1)}>Siguiente</TableActionButton></nav>}
    </div>;
  };

  const setFilter = (key: keyof DocenciaFilters, value?: string) => setFilters((current) => ({ ...current, [key]: value }));

  return <section className="min-h-[calc(100vh-120px)] w-full px-4 py-4">
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><h2 className="text-2xl font-semibold md:text-3xl">Actividades en Docencia</h2><p className="mt-1 text-sm text-slate-500">Gestione actividades, responsables y su historial.</p></div>
      {canCreateRecords() && <Button size="sm" onClick={() => navigate("/docenciaInvestigador/nuevo")}>Agregar nuevo</Button>}
    </div>
    {memoriaFilter && <div className="mb-4"><MemoriaFilterBanner filter={memoriaFilter} /></div>}
    <Table
      caption="Listado de actividades en docencia" columns={columns} rows={rows} getRowId={(item) => item.id}
      onRowClick={(item) => navigate(`/docenciaInvestigador/${item.id}`, { state: buildMemoriaDetailState(location) })}
      getRowTitle={(item) => `Ver detalle de ${item.curso}`} density="compact"
      loading={actividades.isLoading} refreshing={actividades.isFetching && !actividades.isLoading}
      error={actividades.isError} onRetry={() => actividades.refetch()}
      emptyMessage="No hay actividades en docencia que coincidan con los filtros."
      sortKey={sort} sortDirection={direction}
      onSortChange={(key, nextDirection) => { setSort(key as DocenciaSort); setDirection(nextDirection); }}
      expandedRowId={expandedRow} renderExpanded={renderHistory}
      onToggleRow={(item) => { setExpandedRow((current) => current === item.id ? null : item.id); setHistoryPage(1); }}
      getExpandLabel={(item, expanded) => `${expanded ? "Ocultar" : "Mostrar"} historial de ${item.curso}`}
      page={page} totalPages={totalPages} totalRecords={filteredList.length}
      onPageChange={(nextPage) => { setExpandedRow(null); setPage(nextPage); }}
      toolbar={<TableToolbar><div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center">
        <TableSearch label="Buscar actividades en docencia" placeholder="Buscar por curso, institución o investigador" value={search} onChange={(event) => setSearch(event.target.value)} />
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 whitespace-nowrap [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent" aria-label="Filtros de actividades en docencia">
          <span className="shrink-0 text-xs font-medium text-slate-500">Estado</span>
          <TableFilterChip className="shrink-0" active={activeFilter === "true"} onClick={() => setActiveFilter("true")}>Activas</TableFilterChip>
          <TableFilterChip className="shrink-0" active={activeFilter === "all"} onClick={() => setActiveFilter("all")}>Todas</TableFilterChip>
          <TableFilterChip className="shrink-0" active={activeFilter === "false"} onClick={() => setActiveFilter("false")}>Inactivas</TableFilterChip>
          <TableFilterSelect label="Filtrar por curso" placeholder="Todos los cursos" value={filters.curso} onValueChange={(value) => setFilter("curso", value)} options={filterOptions.cursos} />
          <TableFilterSelect label="Filtrar por institución" placeholder="Todas las instituciones" value={filters.institucion} onValueChange={(value) => setFilter("institucion", value)} options={filterOptions.instituciones} />
          <TableFilterSelect label="Filtrar por investigador" placeholder="Todos los investigadores" value={filters.investigador} onValueChange={(value) => setFilter("investigador", value)} options={filterOptions.investigadores} />
          <TableFilterSelect label="Filtrar por grado académico" placeholder="Todos los grados" value={filters.grado} onValueChange={(value) => setFilter("grado", value)} options={filterOptions.grados} />
          <TableFilterSelect label="Filtrar por rol" placeholder="Todos los roles" value={filters.rol} onValueChange={(value) => setFilter("rol", value)} options={filterOptions.roles} />
        </div>
      </div></TableToolbar>}
    />
    <ConfirmDialog open={Boolean(pendingDelete)} title="Eliminar actividad en docencia" message={`¿Está seguro de eliminar ${pendingDelete?.curso ?? "esta actividad"}?`} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} loadingText="Eliminando..." />
    <SuccessToast open={Boolean(successMessage)} message={successMessage} onClose={() => setSuccessMessage("")} />
    <SuccessToast open={Boolean(errorMessage)} message={errorMessage} variant="error" onClose={() => setErrorMessage("")} />
  </section>;
}
