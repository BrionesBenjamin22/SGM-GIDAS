import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import CerrarProyectoDialog from "@/components/CerrarProyectoDialog";
import SuccessToast from "@/components/SuccessToast";
import Tarjeta from "@/components/Tarjeta";
import MemoriaFilterBanner from "@/components/MemoriaFilterBanner";
import { useAuth } from "@/context/AuthContext";
import { useProyectos } from "@/hooks/useProyectos";
import {
  cerrarProyecto,
  reabrirProyecto,
  type Proyecto,
} from "@/services/proyectosServices";
import {
  applyMemoriaSectionFilter,
  getMemoriaSectionFilter,
} from "@/lib/memoriaSectionFilter";

const ITEMS_PER_PAGE = 9;

export default function ProyectosLanding() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { canCreateRecords, canDeleteRecords } = useAuth();

  const puedeCrear = canCreateRecords();
  const puedeEliminar = canDeleteRecords();

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCerrarDialog, setShowCerrarDialog] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    estado: "",
    tipo: "",
    fuente: "",
    investigador: "",
    becario: "",
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [currentPage, setCurrentPage] = useState(1);
  const memoriaFilter = useMemo(
    () => getMemoriaSectionFilter(location.state, "proyectos"),
    [location.state]
  );

  const activosFilter = useMemo<"true" | "false" | "all">(() => {
    if (memoriaFilter) return "all";
    if (filters.estado === "todos") return "all";
    if (filters.estado === "inactivos") return "false";
    return "true";
  }, [filters.estado, memoriaFilter]);

  const { data: list = [], isLoading } = useProyectos(activosFilter);
  const scopedList = useMemo(
    () => applyMemoriaSectionFilter(list, memoriaFilter),
    [list, memoriaFilter]
  );

  const opcionesFiltros = useMemo(() => {
    const tipos = new Set<string>();
    const fuentes = new Set<string>();
    const investigadores = new Set<string>();
    const becarios = new Set<string>();

    scopedList.forEach((proyecto) => {
      if (proyecto.tipoProyectoNombre) {
        tipos.add(proyecto.tipoProyectoNombre);
      }
      if (proyecto.fuenteFinanciamientoNombre) {
        fuentes.add(proyecto.fuenteFinanciamientoNombre);
      }
      proyecto.investigadores?.forEach((investigador) => {
        investigadores.add(investigador.nombre_apellido);
      });
      proyecto.becarios?.forEach((becario) => {
        becarios.add(becario.nombre_apellido);
      });
    });

    return {
      tipos: Array.from(tipos).sort(),
      fuentes: Array.from(fuentes).sort(),
      investigadores: Array.from(investigadores).sort(),
      becarios: Array.from(becarios).sort(),
    };
  }, [scopedList]);

  const proyectosFiltrados = useMemo(() => {
    return scopedList.filter((proyecto) => {
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        proyecto.nombreProyecto?.toLowerCase().includes(query) ||
        proyecto.descripcionProyecto?.toLowerCase().includes(query) ||
        proyecto.dificultadesProyecto?.toLowerCase().includes(query) ||
        proyecto.tipoProyectoNombre?.toLowerCase().includes(query) ||
        proyecto.fuenteFinanciamientoNombre?.toLowerCase().includes(query) ||
        proyecto.investigadores?.some((investigador) =>
          investigador.nombre_apellido.toLowerCase().includes(query)
        ) ||
        proyecto.becarios?.some((becario) =>
          becario.nombre_apellido.toLowerCase().includes(query)
        );

      const matchTipo =
        !filters.tipo || proyecto.tipoProyectoNombre === filters.tipo;

      const matchFuente =
        !filters.fuente ||
        proyecto.fuenteFinanciamientoNombre === filters.fuente;

      const matchInvestigador =
        !filters.investigador ||
        proyecto.investigadores?.some(
          (investigador) =>
            investigador.nombre_apellido === filters.investigador
        );

      const matchBecario =
        !filters.becario ||
        proyecto.becarios?.some(
          (becario) => becario.nombre_apellido === filters.becario
        );

      return (
        matchesSearch &&
        matchTipo &&
        matchFuente &&
        matchInvestigador &&
        matchBecario
      );
    });
  }, [scopedList, filters, searchQuery]);

  const totalPages = Math.ceil(proyectosFiltrados.length / ITEMS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return proyectosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, proyectosFiltrados]);

  const filtrosActivosCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const toggleSelect = (id: string, checked: boolean) => {
    if (!puedeEliminar) return;

    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((currentId) => currentId !== id)
    );
  };

  const cancelSelection = () => {
    setSelectMode(false);
    setSelectedIds([]);
    setShowCerrarDialog(false);
  };

  const confirmCerrar = async (fecha: Date) => {
    const fechaFormateada = fecha.toISOString().split("T")[0];

    for (const id of selectedIds) {
      await cerrarProyecto(id, fechaFormateada);
    }

    await qc.invalidateQueries({ queryKey: ["proyectos"] });
    cancelSelection();
    setSuccessMessage("Proyectos cerrados con exito");
    setShowSuccess(true);
  };

  const handleReabrirSeleccion = async () => {
    for (const id of selectedIds) {
      await reabrirProyecto(id);
    }

    await qc.invalidateQueries({ queryKey: ["proyectos"] });
    cancelSelection();
    setSuccessMessage("Proyectos reabiertos con exito");
    setShowSuccess(true);
  };

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

  const haySeleccionablesCerrados = selectedIds.some((id) =>
    scopedList.some((proyecto) => String(proyecto.id) === id && proyecto.cerrado)
  );

  const haySeleccionablesActivos = selectedIds.some((id) =>
    scopedList.some((proyecto) => String(proyecto.id) === id && !proyecto.cerrado)
  );

  return (
    <section className="flex min-h-[calc(100vh-80px)] w-full flex-col px-4 py-4 text-sm md:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold leading-none text-slate-800 md:text-3xl">
            Proyectos
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            {proyectosFiltrados.length} de {scopedList.length} resultados
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
              Activos
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
              Todos
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
              Cerrados
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por nombre, tipo, investigador..."
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
                  onClick={() => navigate("/proyectos/nuevo")}
                >
                  Nuevo
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {selectedIds.length > 0 && haySeleccionablesActivos && puedeEliminar && (
                <Button size="sm" onClick={() => setShowCerrarDialog(true)}>
                  Cerrar seleccion
                </Button>
              )}

              {selectedIds.length > 0 && haySeleccionablesCerrados && puedeEliminar && (
                <Button size="sm" onClick={handleReabrirSeleccion}>
                  Reabrir seleccion
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
        ) : proyectosFiltrados.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No hay proyectos para mostrar.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedItems.map((proyecto) => (
                <Tarjeta<Proyecto>
                  key={proyecto.id}
                  item={proyecto}
                  title={(item) => item.nombreProyecto}
                  subtitle={(item) => item.tipoProyectoNombre || "PID"}
                  badge={(item) => (item.cerrado ? "CERRADO" : "ACTIVO")}
                  selectable={puedeEliminar && selectMode}
                  selected={selectedIds.includes(String(proyecto.id))}
                  onSelectChange={(checked) =>
                    toggleSelect(String(proyecto.id), checked)
                  }
                  onClick={() =>
                    !selectMode && navigate(`/proyectos/${proyecto.id}`)
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
                    onClick={() => setCurrentPage((page) => page - 1)}
                  >
                    {"<"}
                  </Button>

                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
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
                    onClick={() => setCurrentPage((page) => page + 1)}
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
                  <option value="">Activos (Default)</option>
                  <option value="todos">Todos</option>
                  <option value="inactivos">Cerrados</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Tipo de Proyecto
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.tipo}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      tipo: e.target.value,
                    })
                  }
                >
                  <option value="">Todos los tipos</option>
                  {opcionesFiltros.tipos.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Fuente de Financiamiento
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.fuente}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      fuente: e.target.value,
                    })
                  }
                >
                  <option value="">Todas las fuentes</option>
                  {opcionesFiltros.fuentes.map((fuente) => (
                    <option key={fuente} value={fuente}>
                      {fuente}
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
                  {opcionesFiltros.investigadores.map((investigador) => (
                    <option key={investigador} value={investigador}>
                      {investigador}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block uppercase tracking-wider text-slate-400 font-bold">
                  Becario
                </label>
                <select
                  className="w-full rounded border border-slate-200 p-2 outline-none focus:border-slate-400"
                  value={tempFilters.becario}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      becario: e.target.value,
                    })
                  }
                >
                  <option value="">Todos los becarios</option>
                  {opcionesFiltros.becarios.map((becario) => (
                    <option key={becario} value={becario}>
                      {becario}
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
                    tipo: "",
                    fuente: "",
                    investigador: "",
                    becario: "",
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

      <CerrarProyectoDialog
        open={showCerrarDialog}
        onCancel={() => setShowCerrarDialog(false)}
        onConfirm={confirmCerrar}
      />

      <SuccessToast
        open={showSuccess}
        message={successMessage || "Cambios aplicados con exito"}
        onClose={() => setShowSuccess(false)}
      />
    </section>
  );
}
