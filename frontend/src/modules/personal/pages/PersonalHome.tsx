import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Tarjeta from "@/components/Tarjeta";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import MemoriaFilterBanner from "@/components/MemoriaFilterBanner";
import { usePersonal } from "@/modules/personal/hooks/usePersonal";
import { eliminarPersonal } from "@/modules/personal/services/personalServices";
import type { PersonalType } from "@/modules/personal/services/personalServices";
import { useAuth } from "@/context/AuthContext";
import {
  applyMemoriaSectionFilter,
  getMemoriaSectionFilter,
} from "@/lib/memoriaSectionFilter";
import { buildMemoriaDetailState } from "@/lib/memoriaNavigation";

const ITEMS_PER_PAGE = 9;

export default function PersonalLanding() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [sp] = useSearchParams();
  const tipo = sp.get("tipo") as PersonalType | null;

  const { canCreateRecords, canDeleteRecords } = useAuth();

  const puedeCrear = canCreateRecords();
  const puedeEliminar = canDeleteRecords();

  const [filtroActivos, setFiltroActivos] = useState<"true" | "false" | "all">(
    "true"
  );
  const memoriaFilter = useMemo(
    () =>
      getMemoriaSectionFilter(
        location.state,
        tipo === "INVESTIGADOR"
          ? "investigadores"
          : tipo === "BECARIO"
            ? "becarios"
            : "personal"
      ),
    [location.state, tipo]
  );
  const effectiveActivos = memoriaFilter ? "all" : filtroActivos;

  const { list = [], isLoading, isError } = usePersonal(
    tipo ?? undefined,
    effectiveActivos
  );
  const scopedList = useMemo(
    () => applyMemoriaSectionFilter(list, memoriaFilter),
    [list, memoriaFilter]
  );

  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    rol: "",
    search: "",
  });

  const [tempFilters, setTempFilters] = useState(filters);

  const filtrosActivos = Object.values(filters).filter(Boolean).length;

  const rolesDisponibles = useMemo(() => {
    const roles = scopedList.map((p) => p.rol).filter(Boolean);
    return [...new Set(roles)];
  }, [scopedList]);

  const personalFiltrado = useMemo(() => {
    return scopedList.filter((p) => {
      const search = filters.search.toLowerCase().trim();

      const matchSearch =
        !search ||
        p.nombre_apellido?.toLowerCase().includes(search) ||
        p.rol?.toLowerCase().includes(search) ||
        p.grupo?.nombre?.toLowerCase().includes(search);

      const matchRol = !filters.rol || p.rol === filters.rol;

      return matchSearch && matchRol;
    });
  }, [scopedList, filters]);

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(personalFiltrado.length / ITEMS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return personalFiltrado.slice(start, start + ITEMS_PER_PAGE);
  }, [personalFiltrado, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, tipo, filtroActivos]);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    { id: number; rol: string; nombre: string; activo?: boolean }[]
  >([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const quickEstadoActual =
    filtroActivos === "all"
      ? "todos"
      : filtroActivos === "false"
        ? "inactivos"
        : "activos";

  const toggleSelect = (
    id: number,
    rol: string,
    nombre: string,
    activo: boolean,
    checked: boolean
  ) => {
    if (!puedeEliminar) return;

    if (!activo) {
      setErrorMessage(
        "No se puede eliminar un registro de personal que ya está inactivo."
      );
      setShowError(true);
      return;
    }

    setSelectedItems((prev) =>
      checked
        ? [...prev, { id, rol, nombre, activo }]
        : prev.filter((x) => !(x.id === id && x.rol === rol))
    );
  };

  const cancelSelection = () => {
    setSelectMode(false);
    setSelectedItems([]);
    setShowConfirm(false);
  };

  const selectedActiveItems = selectedItems.filter((item) => item.activo);

  const confirmDelete = async () => {
    if (!puedeEliminar) return;

    const invalidItems = selectedItems.filter((item) => !item.activo);

    if (invalidItems.length > 0) {
      setShowConfirm(false);
      setErrorMessage(
        invalidItems.length === 1
          ? "El registro seleccionado ya está inactivo."
          : "Uno o más registros seleccionados ya están inactivos."
      );
      setShowError(true);
      return;
    }

    try {
      for (const item of selectedActiveItems) {
        await eliminarPersonal(item.id, item.rol);
      }

      await qc.invalidateQueries({
        queryKey: ["personal"],
      });

      setSuccessMessage(
        selectedActiveItems.length === 1
          ? "Registro dado de baja con éxito."
          : "Registros dados de baja con éxito."
      );
      setShowSuccess(true);

      cancelSelection();
    } catch {
      setShowConfirm(false);
      setErrorMessage(
        "Ocurrió un error inesperado al dar de baja el personal."
      );
      setShowError(true);
    }
  };

  return (
    <section className="w-full min-h-[calc(100vh-120px)] px-4 py-4 flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold">Personal</h2>
          {!isLoading && (
            <p className="text-sm text-slate-500 mt-1">
              Mostrando {personalFiltrado.length} de {scopedList.length} resultados
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-end">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setFiltroActivos("true")}
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
              onClick={() => setFiltroActivos("all")}
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
              onClick={() => setFiltroActivos("false")}
              className={`px-3 py-1.5 text-xs border-l border-slate-200 transition-colors ${
                quickEstadoActual === "inactivos"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Inactivos
            </button>
          </div>

          {!selectMode ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTempFilters(filters);
                  setShowFilters(true);
                }}
              >
                Filtros
                {filtrosActivos > 0 && (
                  <span className="ml-2 text-xs bg-slate-800 text-white rounded-full px-2 py-0.5">
                    {filtrosActivos}
                  </span>
                )}
              </Button>

              {puedeEliminar && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectMode(true)}
                >
                  Seleccionar
                </Button>
              )}

              {puedeCrear && (
                <Button size="sm" onClick={() => navigate("/personal/nuevo")}>
                  Agregar nuevo
                </Button>
              )}
            </>
          ) : (
            <>
              {selectedItems.length > 0 && puedeEliminar && (
                <Button size="sm" onClick={() => setShowConfirm(true)}>
                  Eliminar
                </Button>
              )}

              <Button variant="secondary" size="sm" onClick={cancelSelection}>
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>

      {memoriaFilter && <MemoriaFilterBanner filter={memoriaFilter} />}

      <div className="flex-1 flex flex-col">
        {isLoading && <p className="text-slate-500">Cargando…</p>}
        {isError && <p className="text-slate-500">Error al cargar.</p>}

        <div className="flex-1">
          {!isLoading && !isError && personalFiltrado.length === 0 ? (
            <p className="text-slate-500">No hay personal registrado.</p>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedItems.map((p) => (
                <Tarjeta
                  key={`${p.rol}-${p.id}`}
                  item={p}
                  title={(x) => x.nombre_apellido}
                  subtitle={(x) =>
                    x.grupo?.nombre
                      ? `${x.rol} · ${x.grupo.nombre}`
                      : x.rol
                  }
                  badge={(x) => (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        x.activo
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {x.activo ? "ACTIVO" : "INACTIVO"}
                    </span>
                  )}
                  selectable={puedeEliminar && selectMode}
                  selectDisabled={!p.activo}
                  selected={selectedItems.some(
                    (x) => x.id === p.id && x.rol === p.rol
                  )}
                  onSelectChange={(checked) =>
                    toggleSelect(
                      p.id,
                      p.rol,
                      p.nombre_apellido,
                      p.activo,
                      checked
                    )
                  }
                  onClick={() =>
                    !selectMode &&
                    navigate(`/personal/${p.rol}/${p.id}`, {
                      state: buildMemoriaDetailState(location),
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-auto pt-8">
            <div className="flex justify-center items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ←
              </Button>

              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm ${
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
                →
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Eliminar personal"
        message="¿Estás seguro de dar de baja los siguientes registros?"
        items={selectedActiveItems.map((x) => x.nombre)}
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
      />

      {showFilters && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowFilters(false)}
          />

          <div className="fixed top-0 right-0 h-full w-[380px] bg-white z-50 shadow-2xl p-6 flex flex-col">
            <h3 className="text-xl font-semibold mb-6">Filtros</h3>

            <div className="space-y-4 flex-1">
              <div>
                <label className="text-xs text-slate-500">Buscar</label>
                <input
                  className="input mt-1"
                  value={tempFilters.search}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      search: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">Rol</label>
                <select
                  className="input mt-1"
                  value={tempFilters.rol}
                  onChange={(e) =>
                    setTempFilters({
                      ...tempFilters,
                      rol: e.target.value,
                    })
                  }
                >
                  <option value="">Todos</option>
                  {rolesDisponibles.map((rol) => (
                    <option key={rol} value={rol}>
                      {rol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-6 border-t">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setTempFilters({
                    rol: "",
                    search: "",
                  })
                }
              >
                Limpiar
              </Button>

              <Button
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
    </section>
  );
}
