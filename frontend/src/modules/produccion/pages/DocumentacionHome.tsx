import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import MemoriaFilterBanner from "@/components/MemoriaFilterBanner";
import SuccessToast from "@/components/SuccessToast";
import Table, { TableActionButton, TableActions, TableFilterChip, TableRowActionButton, TableSearch, TableToolbar } from "@/components/Table";
import type { TableColumn } from "@/components/Table";
import TableFilterSelect from "@/components/TableFilterSelect";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/httpError";
import { applyMemoriaSectionFilter, getMemoriaSectionFilter } from "@/lib/memoriaSectionFilter";
import { buildMemoriaDetailState } from "@/lib/memoriaNavigation";
import { useDocumentacion } from "@/modules/produccion/hooks/useDocumentacion";
import { deleteDocumentacion, getHistorialDocumentacionById, type Documentacion } from "@/modules/produccion/services/documentacionServices";
import { formatDocumentacionHistoryEntry, presentDocumentacionHistoryItems } from "@/modules/produccion/utils/documentacionHistory";
import { formatFecha, formatFechaHora } from "@/utils/dateTime";
import { toTitleCase } from "@/utils/format";

const ITEMS_PER_PAGE = 9;
const HISTORY_PER_PAGE = 3;

export default function DocumentacionHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { canCreateRecords, canEditRecords, canDeleteRecords } = useAuth();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Documentacion | null>(null);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<"true" | "false" | "all">("true");
  const [autor, setAutor] = useState("");
  const [anio, setAnio] = useState("");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  const memoriaFilter = useMemo(() => getMemoriaSectionFilter(location.state, "documentacion-bibliografica"), [location.state]);
  const documents = useDocumentacion(memoriaFilter ? "all" : estado);
  const scoped = useMemo(() => applyMemoriaSectionFilter(documents.list, memoriaFilter), [documents.list, memoriaFilter]);
  const options = useMemo(() => ({
    autores: [...new Set(scoped.flatMap((item) => item.autores.map((entry) => entry.nombre_apellido.trim())).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    anios: [...new Set(scoped.map((item) => item.anio).filter(Boolean))].sort((a, b) => b - a),
  }), [scoped]);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return scoped.filter((item) => {
      const matches = !query || [item.titulo, item.editorial, String(item.anio), ...item.autores.map((entry) => entry.nombre_apellido)].some((value) => value.toLocaleLowerCase("es").includes(query));
      return matches && (!autor || item.autores.some((entry) => entry.nombre_apellido === autor)) && (!anio || String(item.anio) === anio);
    }).sort((a, b) => direction === "asc" ? a.titulo.localeCompare(b.titulo, "es") : b.titulo.localeCompare(a.titulo, "es"));
  }, [scoped, search, autor, anio, direction]);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const visible = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const expandedItem = expanded === null ? undefined : scoped.find((item) => item.id === expanded);
  const history = useQuery({ queryKey: ["documentacion-historial", expandedItem?.id], queryFn: () => getHistorialDocumentacionById(expandedItem!.id), enabled: Boolean(expandedItem), staleTime: 5 * 60_000 });

  useEffect(() => { setPage(1); setExpanded(null); }, [search, estado, autor, anio]);
  useEffect(() => { if (page > Math.max(totalPages, 1)) setPage(Math.max(totalPages, 1)); }, [page, totalPages]);
  useEffect(() => {
    if (!location.state?.successMessage) return;
    setSuccess(location.state.successMessage);
    navigate(location.pathname, { replace: true, state: { ...location.state, successMessage: undefined } });
  }, [location.pathname, location.state, navigate]);

  const confirmDelete = async () => {
    if (!pendingDelete || pendingDelete.deleted_at || !canDeleteRecords()) return;
    try {
      await deleteDocumentacion(pendingDelete.id);
      await qc.invalidateQueries({ queryKey: ["documentacion"] });
      setPendingDelete(null);
      setSuccess("Documentación eliminada con éxito.");
    } catch (cause) {
      setPendingDelete(null);
      setError(getErrorMessage(cause, "Lo sentimos, no pudimos completar la operación. Intente nuevamente."));
    }
  };

  const renderHistory = () => {
    if (history.isLoading) return <p role="status" aria-live="polite" className="text-sm text-slate-500">Cargando historial…</p>;
    if (history.isError) return <div role="alert" className="flex items-center gap-3 text-sm text-rose-700"><span>Lo sentimos, no pudimos recuperar el historial. Intente nuevamente.</span><TableActionButton onClick={() => history.refetch()}>Reintentar</TableActionButton></div>;
    const entries = presentDocumentacionHistoryItems(history.data ?? []);
    if (!entries.length) return <p className="text-sm text-slate-500">No hay cambios registrados.</p>;
    const pages = Math.ceil(entries.length / HISTORY_PER_PAGE);
    return <div><h3 className="mb-3 text-sm font-semibold text-slate-900">Historial de cambios</h3><ul className="space-y-2">{entries.slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE).map((entry) => {
      const presentation = formatDocumentacionHistoryEntry(entry);
      return <li key={entry.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm"><span className="block font-medium text-slate-800">{presentation.title}</span><span className="mt-1 block text-slate-600">{presentation.description}</span><span className="mt-1 block text-xs text-slate-500">{formatFechaHora(entry.fecha_cambio)} · {entry.usuario_nombre || "Usuario no informado"}</span></li>;
    })}</ul>{pages > 1 && <nav aria-label="Paginación del historial" className="mt-3 flex gap-2"><TableActionButton disabled={historyPage === 1} onClick={() => setHistoryPage((value) => value - 1)}>Anterior</TableActionButton><span className="self-center text-xs text-slate-500">Página {historyPage} de {pages}</span><TableActionButton disabled={historyPage === pages} onClick={() => setHistoryPage((value) => value + 1)}>Siguiente</TableActionButton></nav>}</div>;
  };

  const columns: TableColumn<Documentacion>[] = [
    { id: "titulo", header: "Documento", sortable: true, render: (item) => <div><span className="block font-medium text-slate-900">{toTitleCase(item.titulo) || "-"}</span><span className="mt-0.5 block text-xs text-slate-500">{item.autores.length ? item.autores.map((entry) => entry.nombre_apellido).join(", ") : "Sin autores informados"}</span></div> },
    { id: "editorial", header: "Editorial", priority: "secondary", render: (item) => toTitleCase(item.editorial) || "-" },
    { id: "anio", header: "Año", priority: "tertiary", render: (item) => item.anio || "-" },
    { id: "fecha", header: "Fecha", priority: "tertiary", render: (item) => formatFecha(item.fecha) },
    { id: "estado", header: "Estado", render: (item) => <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${item.deleted_at ? "text-rose-700" : "text-emerald-700"}`}><span aria-hidden="true" className={`h-2 w-2 rounded-full ${item.deleted_at ? "bg-rose-500" : "bg-emerald-500"}`} />{item.deleted_at ? "Inactivo" : "Activo"}</span> },
    { id: "acciones", header: "Acciones", align: "right", render: (item) => <TableActions><TableRowActionButton action="view" aria-label={`Ver detalle de ${item.titulo}`} onClick={() => navigate(`/documentacion/${item.id}`, { state: buildMemoriaDetailState(location) })} />{!item.deleted_at && canEditRecords() && <TableRowActionButton action="edit" aria-label={`Editar ${item.titulo}`} onClick={() => navigate(`/documentacion/${item.id}/editar`)} />}{!item.deleted_at && canDeleteRecords() && <TableRowActionButton action="delete" aria-label={`Eliminar ${item.titulo}`} onClick={() => setPendingDelete(item)} />}</TableActions> },
  ];

  return <>
    <section className="min-h-[calc(100vh-120px)] w-full px-4 py-4">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><h2 className="text-2xl font-semibold md:text-3xl">Documentación y Biblioteca</h2><p className="mt-1 text-sm text-slate-500">Consulte documentos, autores, editoriales y estados.</p></div>{canCreateRecords() && <Button size="sm" onClick={() => navigate("/documentacion/nuevo")}>Agregar nuevo</Button>}</div>
      {memoriaFilter && <div className="mb-4"><MemoriaFilterBanner filter={memoriaFilter} /></div>}
      <Table caption="Listado de documentación y biblioteca" columns={columns} rows={visible} getRowId={(item) => item.id} density="compact" loading={documents.isLoading} refreshing={documents.isFetching && !documents.isLoading} error={documents.isError && documents.list.length === 0} onRetry={() => documents.refetch()} emptyMessage="No hay documentos que coincidan con los filtros." onRowClick={(item) => navigate(`/documentacion/${item.id}`, { state: buildMemoriaDetailState(location) })} getRowTitle={(item) => `Ver detalle de ${item.titulo}`} sortKey="titulo" sortDirection={direction} onSortChange={(_, next) => setDirection(next)} expandedRowId={expanded} renderExpanded={renderHistory} onToggleRow={(item) => { setExpanded((current) => current === item.id ? null : item.id); setHistoryPage(1); }} getExpandLabel={(item, open) => `${open ? "Ocultar" : "Mostrar"} historial de ${item.titulo}`} page={page} totalPages={totalPages} totalRecords={filtered.length} onPageChange={(next) => { setExpanded(null); setPage(next); }} toolbar={<TableToolbar><div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center"><TableSearch label="Buscar documentación" placeholder="Buscar por título, autor, editorial o año" value={search} onChange={(event) => setSearch(event.target.value)} /><div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 whitespace-nowrap [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent" aria-label="Filtros de documentación"><span className="shrink-0 text-xs font-medium text-slate-500">Estado</span><TableFilterChip className="shrink-0" active={estado === "true"} onClick={() => setEstado("true")}>Activos</TableFilterChip><TableFilterChip className="shrink-0" active={estado === "all"} onClick={() => setEstado("all")}>Todos</TableFilterChip><TableFilterChip className="shrink-0" active={estado === "false"} onClick={() => setEstado("false")}>Inactivos</TableFilterChip><TableFilterSelect label="Filtrar por autor" placeholder="Todos los autores" value={autor || undefined} onValueChange={(value) => setAutor(value ?? "")} options={options.autores.map((value) => ({ value, label: value }))} /><TableFilterSelect label="Filtrar por año" placeholder="Todos los años" value={anio || undefined} onValueChange={(value) => setAnio(value ?? "")} options={options.anios.map((value) => ({ value: String(value), label: String(value) }))} /></div></div></TableToolbar>} />
      <ConfirmDialog open={Boolean(pendingDelete)} title="Eliminar documentación" message={`¿Está seguro de eliminar ${pendingDelete?.titulo || "este documento"}?`} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} loadingText="Eliminando..." />
    </section>
    <SuccessToast open={Boolean(success)} message={success} onClose={() => setSuccess("")} />
    <SuccessToast open={Boolean(error)} message={error} variant="error" onClose={() => setError("")} />
  </>;
}
