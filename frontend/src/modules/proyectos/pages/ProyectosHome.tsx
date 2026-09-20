import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, RotateCcw, X } from "lucide-react";

import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import ConfirmDialog from "@/components/ConfirmDialog";
import Field from "@/components/Field";
import MemoriaFilterBanner from "@/components/MemoriaFilterBanner";
import SuccessToast from "@/components/SuccessToast";
import Table, { TableActionButton, TableActions, TableFilterChip, TableSearch, TableToolbar } from "@/components/Table";
import type { TableColumn, TableSortDirection } from "@/components/Table";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/httpError";
import { getMemoriaSectionFilter } from "@/lib/memoriaSectionFilter";
import { buildMemoriaDetailState } from "@/lib/memoriaNavigation";
import { useFuentesFinanciamiento } from "@/modules/catalogos/hooks/useFuenteFinanciamiento";
import { useProyectosPage } from "@/modules/proyectos/hooks/useProyectos";
import { useTiposProyecto } from "@/modules/proyectos/hooks/useTiposProyecto";
import { cerrarProyecto, getHistorialProyectoById, reabrirProyecto, type Proyecto, type ProyectoSort } from "@/modules/proyectos/services/proyectosServices";
import { formatProyectoHistoryEntry } from "@/modules/proyectos/utils/proyectoHistory";
import { formatFecha, toCivilDateString } from "@/utils/dateTime";

const ITEMS_PER_PAGE = 9;
const HISTORY_PER_PAGE = 3;

export default function ProyectosLanding() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { canCreateRecords, canEditRecords, canDeleteRecords } = useAuth();
  const tiposQuery = useTiposProyecto();
  const { fuentes } = useFuentesFinanciamiento();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"true" | "false" | "all">("true");
  const [typeFilter, setTypeFilter] = useState<number | undefined>();
  const [sourceFilter, setSourceFilter] = useState<number | undefined>();
  const [sort, setSort] = useState<ProyectoSort>("fecha_inicio");
  const [direction, setDirection] = useState<TableSortDirection>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [pendingClose, setPendingClose] = useState<Proyecto | null>(null);
  const [pendingReopen, setPendingReopen] = useState<Proyecto | null>(null);
  const [closeDate, setCloseDate] = useState<Date | null>(new Date());
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const memoriaFilter = useMemo(() => getMemoriaSectionFilter(location.state, "proyectos"), [location.state]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setExpandedRow(null);
  }, [debouncedSearch, activeFilter, typeFilter, sourceFilter, sort, direction, memoriaFilter]);

  useEffect(() => {
    if (!location.state?.successMessage) return;
    setSuccessMessage(location.state.successMessage);
    navigate(location.pathname, { replace: true, state: { ...location.state, successMessage: undefined } });
  }, [location.pathname, location.state, navigate]);

  const proyectos = useProyectosPage({
    page,
    perPage: ITEMS_PER_PAGE,
    search: debouncedSearch,
    activos: memoriaFilter ? "all" : activeFilter,
    sort,
    direction,
    tipoProyectoId: typeFilter,
    fuenteFinanciamientoId: sourceFilter,
    ids: memoriaFilter?.ids,
  });

  const expandedProject = expandedRow ? proyectos.list.find((project) => String(project.id) === expandedRow) : undefined;
  const history = useQuery({
    queryKey: ["proyecto-historial", expandedProject?.id],
    queryFn: () => getHistorialProyectoById(Number(expandedProject!.id)),
    enabled: Boolean(expandedProject?.id),
    staleTime: 5 * 60_000,
  });

  const refreshProjects = async (id?: string) => {
    await queryClient.invalidateQueries({ queryKey: ["proyectos"] });
    if (id) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["proyecto", id] }),
        queryClient.invalidateQueries({ queryKey: ["proyecto-historial", id] }),
      ]);
    }
  };

  const confirmClose = async () => {
    if (!pendingClose?.id || !closeDate || !canDeleteRecords()) return;
    const date = toCivilDateString(closeDate);
    if (!date) return;
    try {
      await cerrarProyecto(pendingClose.id, date);
      await refreshProjects(pendingClose.id);
      setPendingClose(null);
      setSuccessMessage("Proyecto cerrado con éxito.");
    } catch (error) {
      setPendingClose(null);
      setErrorMessage(getErrorMessage(error, "Lo sentimos, no pudimos completar la operación. Intente nuevamente."));
    }
  };

  const confirmReopen = async () => {
    if (!pendingReopen?.id || !canEditRecords()) return;
    try {
      await reabrirProyecto(pendingReopen.id);
      await refreshProjects(pendingReopen.id);
      setPendingReopen(null);
      setSuccessMessage("Proyecto reabierto con éxito.");
    } catch (error) {
      setPendingReopen(null);
      setErrorMessage(getErrorMessage(error, "Lo sentimos, no pudimos completar la operación. Intente nuevamente."));
    }
  };

  const columns = useMemo<TableColumn<Proyecto>[]>(() => [
    { id: "codigo", header: "Código", sortable: true, render: (project) => <span className="font-medium text-slate-700">{project.codigoProyecto}</span> },
    { id: "nombre", header: "Proyecto", sortable: true, render: (project) => <span className="font-medium text-slate-900">{project.nombreProyecto}</span> },
    { id: "tipo", header: "Tipo", sortable: true, priority: "secondary", render: (project) => project.tipoProyectoNombre || "—" },
    { id: "coordinador", header: "Coordinador", priority: "secondary", render: (project) => project.investigadores?.find((item) => item.es_coordinador)?.nombre_apellido || "—" },
    { id: "fecha_inicio", header: "Inicio", sortable: true, priority: "tertiary", render: (project) => formatFecha(project.fechaInicio) },
    { id: "estado", header: "Estado", sortable: true, render: (project) => <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${project.cerrado ? "text-amber-700" : "text-emerald-700"}`}><span aria-hidden="true" className={`h-2 w-2 rounded-full ${project.cerrado ? "bg-amber-500" : "bg-emerald-500"}`} />{project.cerrado ? "Cerrado" : "Activo"}</span> },
    { id: "acciones", header: "Acciones", align: "right", render: (project) => <TableActions>
      <TableActionButton title="Ver detalle" aria-label={`Ver detalle de ${project.nombreProyecto}`} className="h-8 w-8 p-0" onClick={() => navigate(`/proyectos/${project.id}`, { state: buildMemoriaDetailState(location) })}><Eye aria-hidden="true" className="h-4 w-4" /></TableActionButton>
      {!project.cerrado && canEditRecords() && <TableActionButton title="Editar" aria-label={`Editar ${project.nombreProyecto}`} className="h-8 w-8 p-0" onClick={() => navigate(`/proyectos/editar/${project.id}`)}><Pencil aria-hidden="true" className="h-4 w-4" /></TableActionButton>}
      {!project.cerrado && canDeleteRecords() && <TableActionButton title="Cerrar" aria-label={`Cerrar ${project.nombreProyecto}`} className="h-8 w-8 p-0 text-rose-700 hover:bg-rose-50" onClick={() => { setCloseDate(new Date()); setPendingClose(project); }}><X aria-hidden="true" className="h-4 w-4" /></TableActionButton>}
      {project.cerrado && canEditRecords() && <TableActionButton title="Reabrir" aria-label={`Reabrir ${project.nombreProyecto}`} className="h-8 w-8 p-0" onClick={() => setPendingReopen(project)}><RotateCcw aria-hidden="true" className="h-4 w-4" /></TableActionButton>}
    </TableActions> },
  ], [canDeleteRecords, canEditRecords, location, navigate]);

  const renderHistory = () => {
    if (history.isLoading) return <p role="status" aria-live="polite" className="text-sm text-slate-500">Cargando historial…</p>;
    if (history.isError) return <div role="alert" className="flex items-center gap-3 text-sm text-rose-700"><span>Lo sentimos, no pudimos recuperar el historial. Intente nuevamente.</span><TableActionButton onClick={() => history.refetch()}>Reintentar</TableActionButton></div>;
    const entries = history.data ?? [];
    if (!entries.length) return <p className="text-sm text-slate-500">No hay cambios registrados.</p>;
    const pages = Math.ceil(entries.length / HISTORY_PER_PAGE);
    const visible = entries.slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE);
    return <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Historial de cambios</h3>
      <ul className="space-y-2">{visible.map((entry) => { const presentation = formatProyectoHistoryEntry(entry, expandedProject); return <li key={entry.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm"><span className="block font-medium text-slate-800">{presentation.title}</span><span className="mt-1 block text-slate-600">{presentation.description}</span>{entry.usuario_nombre && <span className="mt-1 block text-xs text-slate-500">Por {entry.usuario_nombre}</span>}</li>; })}</ul>
      {pages > 1 && <nav aria-label="Paginación del historial" className="mt-3 flex gap-2"><TableActionButton disabled={historyPage === 1} onClick={() => setHistoryPage((value) => value - 1)}>Anterior</TableActionButton><span className="self-center text-xs text-slate-500">Página {historyPage} de {pages}</span><TableActionButton disabled={historyPage === pages} onClick={() => setHistoryPage((value) => value + 1)}>Siguiente</TableActionButton></nav>}
    </div>;
  };

  return <section className="min-h-[calc(100vh-120px)] w-full px-4 py-4">
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><h2 className="text-2xl font-semibold md:text-3xl">Proyectos</h2><p className="mt-1 text-sm text-slate-500">Gestione proyectos, integrantes, estados y su historial.</p></div>
      {canCreateRecords() && <Button size="sm" onClick={() => navigate("/proyectos/nuevo")}>Agregar nuevo</Button>}
    </div>
    {memoriaFilter && <div className="mb-4"><MemoriaFilterBanner filter={memoriaFilter} /></div>}
    <Table
      caption="Listado de proyectos"
      columns={columns}
      rows={proyectos.list}
      getRowId={(project) => String(project.id)}
      onRowClick={(project) => navigate(`/proyectos/${project.id}`, { state: buildMemoriaDetailState(location) })}
      getRowTitle={(project) => `Ver detalle de ${project.nombreProyecto}`}
      density="compact"
      loading={proyectos.isLoading}
      refreshing={proyectos.isFetching && !proyectos.isLoading}
      error={proyectos.isError}
      onRetry={() => proyectos.refetch()}
      emptyMessage="No hay proyectos que coincidan con los filtros."
      sortKey={sort}
      sortDirection={direction}
      onSortChange={(key, nextDirection) => { setSort(key as ProyectoSort); setDirection(nextDirection); }}
      expandedRowId={expandedRow}
      renderExpanded={renderHistory}
      onToggleRow={(project) => { const id = String(project.id); setExpandedRow((current) => current === id ? null : id); setHistoryPage(1); }}
      getExpandLabel={(project, expanded) => `${expanded ? "Ocultar" : "Mostrar"} historial de ${project.nombreProyecto}`}
      page={page}
      totalPages={proyectos.meta.total_pages}
      totalRecords={proyectos.meta.total}
      onPageChange={(nextPage) => { setExpandedRow(null); setPage(nextPage); }}
      toolbar={<TableToolbar><div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center">
        <TableSearch label="Buscar proyectos" placeholder="Buscar por código, nombre, tipo o integrante" value={search} onChange={(event) => setSearch(event.target.value)} />
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 whitespace-nowrap" aria-label="Filtros de proyectos">
          <span className="shrink-0 text-xs font-medium text-slate-500">Estado</span>
          <TableFilterChip className="shrink-0" active={activeFilter === "true"} onClick={() => setActiveFilter("true")}>Activos</TableFilterChip>
          <TableFilterChip className="shrink-0" active={activeFilter === "all"} onClick={() => setActiveFilter("all")}>Todos</TableFilterChip>
          <TableFilterChip className="shrink-0" active={activeFilter === "false"} onClick={() => setActiveFilter("false")}>Cerrados</TableFilterChip>
          <select aria-label="Filtrar por tipo de proyecto" className="h-8 shrink-0 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-slate-500" value={typeFilter ?? ""} onChange={(event) => setTypeFilter(event.target.value ? Number(event.target.value) : undefined)}><option value="">Todos los tipos</option>{(tiposQuery.data ?? []).map((type) => <option key={type.id} value={type.id}>{type.nombre}</option>)}</select>
          <select aria-label="Filtrar por fuente de financiamiento" className="h-8 shrink-0 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-slate-500" value={sourceFilter ?? ""} onChange={(event) => setSourceFilter(event.target.value ? Number(event.target.value) : undefined)}><option value="">Todas las fuentes</option>{fuentes.map((source) => <option key={source.id} value={source.id}>{source.nombre}</option>)}</select>
        </div>
      </div></TableToolbar>}
    />
    <ConfirmDialog open={Boolean(pendingClose)} title="Cerrar proyecto" onCancel={() => setPendingClose(null)} onConfirm={confirmClose} confirmText="Confirmar cierre" confirmDisabled={!closeDate} loadingText="Cerrando..."><Field label="Fecha de cierre" name="fechaCierre" required><Calendar value={closeDate} onChange={setCloseDate} maxDate={new Date()} className="input" helperText="DD/MM/AAAA" /></Field></ConfirmDialog>
    <ConfirmDialog open={Boolean(pendingReopen)} title="Reabrir proyecto" message={`¿Está seguro de reabrir ${pendingReopen?.nombreProyecto ?? "este proyecto"}?`} confirmText="Reabrir" loadingText="Reabriendo..." onCancel={() => setPendingReopen(null)} onConfirm={confirmReopen} />
    <SuccessToast open={Boolean(successMessage)} message={successMessage} onClose={() => setSuccessMessage("")} />
    <SuccessToast open={Boolean(errorMessage)} message={errorMessage} variant="error" onClose={() => setErrorMessage("")} />
  </section>;
}
