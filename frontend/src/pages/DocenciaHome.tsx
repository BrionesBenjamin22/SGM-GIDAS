import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Tarjeta from "@/components/Tarjeta";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import MemoriaFilterBanner from "@/components/MemoriaFilterBanner";
import {
  getActividadesDocencia,
  eliminarActividadDocencia,
  type ActividadDocencia,
} from "@/services/actividadDocenciaServices";
import { toTitleCase } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";
import {
  applyMemoriaSectionFilter,
  getMemoriaSectionFilter,
} from "@/lib/memoriaSectionFilter";
import { buildMemoriaDetailState } from "@/lib/memoriaNavigation";

const ITEMS_PER_PAGE = 9;

export default function DocenciaLanding() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const { canCreateRecords, canDeleteRecords } = useAuth();

  const puedeCrear = canCreateRecords();
  const puedeEliminar = canDeleteRecords();

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState({
    estado: "",
    curso: "",
    institucion: "",
    investigador: "",
    gradoAcademico: "",
    rolActividad: "",
  });

  const [tempFilters, setTempFilters] = useState(filters);
  const memoriaFilter = useMemo(
    () => getMemoriaSectionFilter(location.state, "actividades-docencia"),
    [location.state]
  );

  const filtroActivos = useMemo<"true" | "false" | "all">(() => {
    if (memoriaFilter) return "all";
    if (filters.estado === "todos") return "all";
    if (filters.estado === "inactivos") return "false";
    return "true";
  }, [filters.estado, memoriaFilter]);

  const { data: list = [], isLoading, isError } = useQuery({
    queryKey: ["docencia", "all", filtroActivos],
    queryFn: () => getActividadesDocencia(undefined, filtroActivos),
  });
  const scopedList = useMemo(
    () => applyMemoriaSectionFilter(list, memoriaFilter),
    [list, memoriaFilter]
  );

  const getInvestigadorNombre = (d: ActividadDocencia) =>
    typeof d.investigador === "string"
      ? d.investigador
      : d.investigador?.nombre_apellido ?? "";

  const opcionesFiltros = useMemo(() => {
    const cursos = new Set<string>();
    const instituciones = new Set<string>();
    const investigadores = new Set<string>();
    const gradosAcademicos = new Set<string>();
    const rolesActividad = new Set<string>();

    scopedList.forEach((d) => {
      if (d.curso) cursos.add(toTitleCase(d.curso));
      if (d.institucion) instituciones.add(toTitleCase(d.institucion));
      if (getInvestigadorNombre(d)) {
        investigadores.add(toTitleCase(getInvestigadorNombre(d)));
      }
      if (d.grado_academico) gradosAcademicos.add(toTitleCase(d.grado_academico));
      if (d.rol_actividad) rolesActividad.add(toTitleCase(d.rol_actividad));
    });

    return {
      cursos: Array.from(cursos).sort(),
      instituciones: Array.from(instituciones).sort(),
      investigadores: Array.from(investigadores).sort(),
      gradosAcademicos: Array.from(gradosAcademicos).sort(),
      rolesActividad: Array.from(rolesActividad).sort(),
    };
  }, [scopedList]);

  const docenciaFiltrada = useMemo(() => {
    return scopedList.filter((d) => {
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        d.curso?.toLowerCase().includes(query) ||
        d.institucion?.toLowerCase().includes(query) ||
        getInvestigadorNombre(d).toLowerCase().includes(query) ||
        d.grado_academico?.toLowerCase().includes(query) ||
        d.rol_actividad?.toLowerCase().includes(query);

      const matchCurso = !filters.curso || toTitleCase(d.curso) === filters.curso;

      const matchInstitucion =
        !filters.institucion ||
        toTitleCase(d.institucion) === filters.institucion;

      const matchInvestigador =
        !filters.investigador ||
        toTitleCase(getInvestigadorNombre(d)) === filters.investigador;

      const matchGradoAcademico =
        !filters.gradoAcademico ||
        toTitleCase(d.grado_academico) === filters.gradoAcademico;

      const matchRolActividad =
        !filters.rolActividad ||
        toTitleCase(d.rol_actividad) === filters.rolActividad;

      return (
        matchesSearch &&
        matchCurso &&
        matchInstitucion &&
        matchInvestigador &&
        matchGradoAcademico &&
        matchRolActividad
      );
    });
  }, [scopedList, filters, searchQuery]);

  const filtrosActivosCount = Object.values(filters).filter(Boolean).length;

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(docenciaFiltrada.length / ITEMS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return docenciaFiltrada.slice(start, start + ITEMS_PER_PAGE);
  }, [docenciaFiltrada, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroActivos, searchQuery, filters]);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const setQuickEstado = (estado: "" | "todos" | "inactivos") => {
    setFilters((prev) => ({
      ...prev,
      estado,
    }));
  };

  const quickEstadoActual =
    filters.estado === "todos"
      ? "todos"
      : filters.estado === "inactivos"
        ? "inactivos"
        : "activos";

  const toggleSelect = (id: number, checked: boolean) => {
    if (!puedeEliminar) return;

    const item = scopedList.find((x) => x.id === id);

    if (item?.deleted_at) {
      setErrorMessage(
        "No se puede eliminar una actividad en docencia que ya fue eliminada."
      );
      setShowError(true);
      return;
    }

    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const cancelSelection = () => {
    setSelectMode(false);
    setSelectedIds([]);
    setShowConfirm(false);
  };

  const selectedItems = scopedList.filter((d) => selectedIds.includes(d.id));
  const selectedActiveItems = selectedItems.filter((d) => !d.deleted_at);

  const confirmDelete = async () => {
    if (!puedeEliminar) return;

    const invalidItems = selectedItems.filter((d) => d.deleted_at);

    if (invalidItems.length > 0) {
      setShowConfirm(false);
      setErrorMessage(
        invalidItems.length === 1
          ? "La actividad seleccionada ya fue eliminada."
          : "Una o mas actividades seleccionadas ya fueron eliminadas."
      );
      setShowError(true);
      return;
    }

    try {
      for (const item of selectedActiveItems) {
        await eliminarActividadDocencia(item.id);
      }

      await qc.invalidateQueries({ queryKey: ["docencia"] });
      cancelSelection();

      setSuccessMessage(
        selectedActiveItems.length === 1
          ? "Actividad en docencia eliminada con exito."
          : "Actividades en docencia eliminadas con exito."
      );
      setShowSuccess(true);
    } catch {
      setShowConfirm(false);
      setErrorMessage(
        "Ocurrio un error inesperado al eliminar la actividad en docencia."
      );
      setShowError(true);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-80px)] w-full flex-col px-4 py-4 text-sm md:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold leading-none text-slate-800 md:text-3xl">
            Actividades en Docencia
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            {docenciaFiltrada.length} de {scopedList.length} resultados
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setQuickEstado("")}
              className={`px-3 py-1.5 text-xs transition-colors ${
                quickEstadoActual === "activos"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Activas
            </button>

            <button
              type="button"
              onClick={() => setQuickEstado("todos")}
              className={`border-l border-slate-200 px-3 py-1.5 text-xs transition-colors ${
                quickEstadoActual === "todos"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todas
            </button>

            <button
              type="button"
              onClick={() => setQuickEstado("inactivos")}
              className={`border-l border-slate-200 px-3 py-1.5 text-xs transition-colors ${
                quickEstadoActual === "inactivos"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Inactivas
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por curso, institucion, investigador..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-10 text-xs outline-none transition-all focus:bg-white focus:ring-2 focus:ring-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {!selectMode ? (
            <div className="flex gap-2">
              {puedeEliminar && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectMode(true)}
                >
                  Seleccionar
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTempFilters(filters);
                  setShowFilters(true);
                }}
              >
                Filtros
                {filtrosActivosCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] text-white">
                    {filtrosActivosCount}
                  </span>
                )}
              </Button>

              {puedeCrear && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/docenciaInvestigador/nuevo")}
                >
                  Nuevo
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {selectedIds.length > 0 && puedeEliminar && (
                <Button size="sm" onClick={() => setShowConfirm(true)}>
                  Eliminar
                </Button>
              )}

              <Button variant="secondary" size="sm" onClick={cancelSelection}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      {memoriaFilter && <MemoriaFilterBanner filter={memoriaFilter} />}

      <div className="flex-1">
        {isLoading ? (
          <p className="py-10 text-center text-slate-500">Cargando...</p>
        ) : isError ? (
          <p className="py-10 text-center text-slate-500">Error al cargar.</p>
        ) : docenciaFiltrada.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No hay actividades registradas.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedItems.map((d) => (
                <Tarjeta<ActividadDocencia>
                  key={d.id}
                  item={d}
                  title={(x) => toTitleCase(x.curso) || "-"}
                  subtitle={(x) => toTitleCase(getInvestigadorNombre(x)) || "-"}
                  badge={(x) => (x.deleted_at ? "INACTIVA" : "ACTIVA")}
                  selectable={puedeEliminar && selectMode}
                  selectDisabled={!!d.deleted_at}
                  selected={selectedIds.includes(d.id)}
                  onSelectChange={(checked) => toggleSelect(d.id, checked)}
                  onClick={() =>
                    !selectMode &&
                    navigate(`/docenciaInvestigador/${d.id}`, {
                      state: buildMemoriaDetailState(location),
                    })
                  }
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    {"<"}
                  </Button>

                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-lg px-3 py-1 text-sm ${
                          currentPage === page
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 hover:bg-slate-200"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    {">"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showFilters && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-[380px] flex-col overflow-y-auto bg-white p-6 shadow-2xl">
            <h3 className="mb-6 text-xl font-semibold">Filtros Avanzados</h3>

            <div className="flex-1 space-y-5 text-[11px]">
              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Estado
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.estado}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      estado: e.target.value,
                    })
                  }
                >
                  <option value="">Activas (Default)</option>
                  <option value="todos">Todas</option>
                  <option value="inactivos">Inactivas</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Curso
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.curso}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      curso: e.target.value,
                    })
                  }
                >
                  <option value="">Todos los cursos</option>
                  {opcionesFiltros.cursos.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Institucion
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.institucion}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      institucion: e.target.value,
                    })
                  }
                >
                  <option value="">Todas las instituciones</option>
                  {opcionesFiltros.instituciones.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Investigador
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.investigador}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      investigador: e.target.value,
                    })
                  }
                >
                  <option value="">Todos los investigadores</option>
                  {opcionesFiltros.investigadores.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Grado Academico
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.gradoAcademico}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      gradoAcademico: e.target.value,
                    })
                  }
                >
                  <option value="">Todos los grados</option>
                  {opcionesFiltros.gradosAcademicos.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Rol de Actividad
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.rolActividad}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      rolActividad: e.target.value,
                    })
                  }
                >
                  <option value="">Todos los roles</option>
                  {opcionesFiltros.rolesActividad.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-between gap-2 border-t pt-6">
              <Button
                variant="secondary"
                className="flex-1"
                size="sm"
                onClick={() =>
                  setTempFilters({
                    estado: "",
                    curso: "",
                    institucion: "",
                    investigador: "",
                    gradoAcademico: "",
                    rolActividad: "",
                  })
                }
              >
                Limpiar
              </Button>

              <Button
                className="flex-1"
                size="sm"
                onClick={() => {
                  setFilters(tempFilters);
                  setShowFilters(false);
                }}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="Eliminar actividades en docencia"
        message="¿Estas seguro de eliminar las siguientes actividades?"
        items={selectedActiveItems.map((d) => toTitleCase(d.curso) || "-")}
        onCancel={cancelSelection}
        onConfirm={confirmDelete}
      />

      <SuccessToast
        open={showSuccess}
        message={successMessage}
        onClose={() => setShowSuccess(false)}
      />

      <SuccessToast
        open={showError}
        message={errorMessage}
        onClose={() => setShowError(false)}
        variant="error"
      />
    </section>
  );
}
