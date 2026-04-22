import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import Tarjeta from "@/components/Tarjeta";
import SuccessToast from "@/components/SuccessToast";
import CerrarProyectoDialog from "@/components/CerrarProyectoDialog";

import { useProyectos } from "@/hooks/useProyectos";
import type { Proyecto } from "@/services/proyectosServices";
import { cerrarProyecto, reabrirProyecto } from "@/services/proyectosServices";
import { useAuth } from "@/context/AuthContext";

export default function ProyectosLanding() {
  const navigate = useNavigate();
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

  const activosFilter = useMemo<"true" | "false" | "all">(() => {
    if (filters.estado === "todos") return "all";
    if (filters.estado === "inactivos") return "false";
    return "true";
  }, [filters.estado]);

  const { data: list = [], isLoading } = useProyectos(activosFilter);

  const opcionesFiltros = useMemo(() => {
    const tipos = new Set<string>();
    const fuentes = new Set<string>();
    const investigadores = new Set<string>();
    const becarios = new Set<string>();

    list.forEach((p) => {
      if (p.tipoProyectoNombre) tipos.add(p.tipoProyectoNombre);
      if (p.fuenteFinanciamientoNombre) {
        fuentes.add(p.fuenteFinanciamientoNombre);
      }
      p.investigadores?.forEach((i) =>
        investigadores.add(i.nombre_apellido)
      );
      p.becarios?.forEach((b) => becarios.add(b.nombre_apellido));
    });

    return {
      tipos: Array.from(tipos).sort(),
      fuentes: Array.from(fuentes).sort(),
      investigadores: Array.from(investigadores).sort(),
      becarios: Array.from(becarios).sort(),
    };
  }, [list]);

  const proyectosFiltrados = useMemo(() => {
    return list.filter((p) => {
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        p.nombreProyecto?.toLowerCase().includes(query) ||
        p.descripcionProyecto?.toLowerCase().includes(query) ||
        p.dificultadesProyecto?.toLowerCase().includes(query) ||
        p.tipoProyectoNombre?.toLowerCase().includes(query) ||
        p.fuenteFinanciamientoNombre?.toLowerCase().includes(query) ||
        p.investigadores?.some((i) =>
          i.nombre_apellido.toLowerCase().includes(query)
        ) ||
        p.becarios?.some((b) =>
          b.nombre_apellido.toLowerCase().includes(query)
        );

      const matchTipo =
        !filters.tipo || p.tipoProyectoNombre === filters.tipo;

      const matchFuente =
        !filters.fuente ||
        p.fuenteFinanciamientoNombre === filters.fuente;

      const matchInvestigador =
        !filters.investigador ||
        p.investigadores?.some(
          (i) => i.nombre_apellido === filters.investigador
        );

      const matchBecario =
        !filters.becario ||
        p.becarios?.some(
          (b) => b.nombre_apellido === filters.becario
        );

      return (
        matchesSearch &&
        matchTipo &&
        matchFuente &&
        matchInvestigador &&
        matchBecario
      );
    });
  }, [list, filters, searchQuery]);

  const filtrosActivosCount = Object.values(filters).filter(Boolean).length;

  const toggleSelect = (id: string, checked: boolean) => {
    if (!puedeEliminar) return;

    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
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
    setSuccessMessage("Proyectos cerrados con éxito");
    setShowSuccess(true);
  };

  const handleReabrirSeleccion = async () => {
    for (const id of selectedIds) {
      await reabrirProyecto(id);
    }

    await qc.invalidateQueries({ queryKey: ["proyectos"] });
    cancelSelection();
    setSuccessMessage("Proyectos reabiertos con éxito");
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
    list.some((p) => String(p.id) === id && p.cerrado === true)
  );

  const haySeleccionablesActivos = selectedIds.some((id) =>
    list.some((p) => String(p.id) === id && p.cerrado !== true)
  );

  return (
    <section className="w-full min-h-[calc(100vh-80px)] px-4 md:px-6 py-4 flex flex-col text-sm">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold leading-none text-slate-800">
            Proyectos
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            {proyectosFiltrados.length} de {list.length} resultados
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
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
              className={`px-3 py-1.5 text-xs border-l border-slate-200 transition-colors ${
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
              className={`px-3 py-1.5 text-xs border-l border-slate-200 transition-colors ${
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
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-1.5 focus:bg-white focus:ring-2 focus:ring-slate-200 outline-none transition-all text-xs"
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
                Filtros{" "}
                {filtrosActivosCount > 0 && (
                  <span className="ml-1.5 bg-slate-800 text-white text-[10px] rounded-full px-1.5 py-0.5">
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
              {selectedIds.length > 0 &&
                haySeleccionablesActivos &&
                puedeEliminar && (
                <Button size="sm" onClick={() => setShowCerrarDialog(true)}>
                  Cerrar selección
                </Button>
              )}

              {selectedIds.length > 0 &&
                haySeleccionablesCerrados &&
                puedeEliminar && (
                <Button size="sm" onClick={handleReabrirSeleccion}>
                  Reabrir selección
                </Button>
              )}

              <Button variant="secondary" size="sm" onClick={cancelSelection}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <p className="text-slate-500 text-center py-10">Cargando…</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {proyectosFiltrados.map((p) => (
              <Tarjeta<Proyecto>
                key={p.id}
                item={p}
                title={(x) => x.nombreProyecto}
                subtitle={(x) => x.tipoProyectoNombre || "PID"}
                badge={(x) => (x.cerrado ? "CERRADO" : "ACTIVO")}
                selectable={puedeEliminar && selectMode}
                selected={selectedIds.includes(String(p.id))}
                onSelectChange={(checked) =>
                  toggleSelect(String(p.id), checked)
                }
                onClick={() => !selectMode && navigate(`/proyectos/${p.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {showFilters && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setShowFilters(false)}
          />
          <div className="fixed top-0 right-0 h-full w-[380px] bg-white z-50 shadow-2xl p-6 flex flex-col overflow-y-auto">
            <h3 className="text-xl font-semibold mb-6">Filtros Avanzados</h3>

            <div className="space-y-5 flex-1 text-[11px]">
              <div>
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Estado
                </label>
                <select
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
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
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Tipo de Proyecto
                </label>
                <select
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
                  value={tempFilters.tipo}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      tipo: e.target.value,
                    })
                  }
                >
                  <option value="">Todos los tipos</option>
                  {opcionesFiltros.tipos.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Fuente de Financiamiento
                </label>
                <select
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
                  value={tempFilters.fuente}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      fuente: e.target.value,
                    })
                  }
                >
                  <option value="">Todas las fuentes</option>
                  {opcionesFiltros.fuentes.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Investigador
                </label>
                <select
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
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
                <label className="text-slate-400 font-bold mb-1 block uppercase tracking-wider">
                  Becario
                </label>
                <select
                  className="w-full border border-slate-200 p-2 rounded outline-none focus:border-slate-400"
                  value={tempFilters.becario}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      becario: e.target.value,
                    })
                  }
                >
                  <option value="">Todos los becarios</option>
                  {opcionesFiltros.becarios.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-6 border-t mt-4">
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
        message={successMessage || "Cambios aplicados con éxito"}
        onClose={() => setShowSuccess(false)}
      />
    </section>
  );
}
