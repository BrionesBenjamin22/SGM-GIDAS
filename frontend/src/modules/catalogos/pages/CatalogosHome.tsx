import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUp,
  ChevronDown,
  Info,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  createCatalogItem,
  deleteCatalogItem,
  getCatalogItems,
  updateCatalogItem,
  type CatalogItem,
} from "@/services/catalogoServices";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import ErrorText from "@/components/ErrorText";
import Field from "@/components/Field";
import SuccessToast from "@/components/SuccessToast";
import Tarjeta from "@/components/Tarjeta";
import { HttpError } from "@/lib/http";

type CatalogGroup =
  | "Institucionales / normativos"
  | "Operativos"
  | "Financiamiento y administracion"
  | "Propiedad intelectual";

type CatalogTag =
  | "Protegido"
  | "Editable"
  | "Sensible"
  | "Impacta memorias"
  | "Operativo"
  | "Historico"
  | "Sistema"
  | "Institucional";

type StatusFilter = "all" | "active" | "inactive";
type CatalogGroupFilter = CatalogGroup | "Todos";

type FkField = {
  idField: string;
  label: string;
  endpoint: string;
  optionLabel?: string;
};

type CatalogDef = {
  label: string;
  endpoint: string;
  description: string;
  helpText: string;
  group: CatalogGroup;
  tags: CatalogTag[];
  nameField?: string;
  descField?: string;
  fkField?: FkField;
};

type CatalogSummary = {
  total: number;
  active: number | null;
  inactive: number | null;
  latest: string | null;
  hasInactive: boolean;
};

type ToastState = {
  open: boolean;
  message: string;
  variant: "success" | "error";
};

const CATALOG_GROUPS: CatalogGroup[] = [
  "Institucionales / normativos",
  "Operativos",
  "Financiamiento y administracion",
  "Propiedad intelectual",
];

const CATALOG_ITEMS_PER_PAGE = 5;

function scrollToPageTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const CATALOGS: CatalogDef[] = [
  {
    label: "Tipo de Personal",
    endpoint: "/tipo-personal/",
    description: "Clasifica personas dentro de la estructura del sistema.",
    helpText:
      "Catalogo estructural. Sus valores clasifican personal; evite modificar nombres usados historicamente.",
    group: "Institucionales / normativos",
    tags: ["Sensible", "Impacta memorias", "Institucional"],
  },
  {
    label: "Nivel de Formacion",
    endpoint: "/tipo-formacion/",
    description: "Clasifica la formacion asociada a becarios.",
    helpText:
      "Catalogo institucional. Use la edicion solo para correcciones menores.",
    group: "Institucionales / normativos",
    tags: ["Sensible", "Impacta memorias", "Institucional"],
  },
  {
    label: "Categoria UTN",
    endpoint: "/categoria-utn/",
    description: "Define categorias institucionales de investigadores.",
    helpText:
      "Catalogo institucional sensible. Si cambia el significado, cree un nuevo valor y conserve el anterior.",
    group: "Institucionales / normativos",
    tags: ["Protegido", "Sensible", "Impacta memorias", "Institucional"],
  },
  {
    label: "Tipo de Dedicacion",
    endpoint: "/tipo-dedicacion/",
    description: "Define dedicaciones usadas por investigadores.",
    helpText:
      "Catalogo estructural. Evite reutilizar valores para representar dedicaciones distintas.",
    group: "Institucionales / normativos",
    tags: ["Sensible", "Impacta memorias", "Institucional"],
  },
  {
    label: "Grado Academico",
    endpoint: "/grado-academico",
    description: "Define grados academicos usados en actividades docentes.",
    helpText:
      "Catalogo institucional. Mantenga nombres estables para preservar visualizacion historica.",
    group: "Institucionales / normativos",
    tags: ["Sensible", "Impacta memorias", "Institucional"],
  },
  {
    label: "Programa de Incentivos",
    endpoint: "/programas-incentivos/",
    description: "Define programas asociados a investigadores.",
    helpText:
      "Catalogo historico. No elimine programas anteriores si fueron usados; mantenga trazabilidad.",
    group: "Institucionales / normativos",
    tags: ["Historico", "Sensible", "Impacta memorias"],
  },
  {
    label: "Becas",
    endpoint: "/becas/",
    description: "Define becas y su fuente de financiamiento asociada.",
    helpText:
      "Catalogo operativo. Revise duplicados antes de crear una nueva beca.",
    group: "Operativos",
    tags: ["Editable", "Operativo"],
    nameField: "nombre_beca",
    descField: "descripcion",
    fkField: {
      idField: "fuente_financiamiento_id",
      label: "Fuente de Financiamiento",
      endpoint: "/fuente-financiamiento/",
    },
  },
  {
    label: "Cargos",
    endpoint: "/cargos/",
    description: "Define cargos usados en autoridades y directivos del grupo.",
    helpText:
      "Catalogo operativo. Evite renombrar cargos usados historicamente salvo correcciones menores.",
    group: "Operativos",
    tags: ["Editable", "Operativo"],
  },
  {
    label: "Tipo de Proyecto",
    endpoint: "/tipo-proyecto/",
    description: "Clasifica proyectos de investigacion.",
    helpText:
      "Catalogo operativo con impacto en proyectos y memorias. Use nuevos valores ante cambios conceptuales.",
    group: "Operativos",
    tags: ["Editable", "Operativo", "Impacta memorias"],
  },
  {
    label: "Rol de Actividad",
    endpoint: "/rol-actividad",
    description: "Clasifica el rol ocupado en actividades docentes.",
    helpText:
      "Catalogo operativo. Use la edicion para correcciones menores de nombre.",
    group: "Operativos",
    tags: ["Editable", "Operativo", "Impacta memorias"],
  },
  {
    label: "Tipo de Reunion Cientifica",
    endpoint: "/tipos-reunion-cientifica/",
    description: "Clasifica reuniones cientificas para trabajos presentados.",
    helpText:
      "Catalogo operativo. Revise duplicados antes de crear una nueva clasificacion.",
    group: "Operativos",
    tags: ["Editable", "Operativo", "Impacta memorias"],
  },
  {
    label: "Fuente de Financiamiento",
    endpoint: "/fuente-financiamiento/",
    description: "Define el origen de fondos usado en becas, proyectos y erogaciones.",
    helpText:
      "Catalogo operativo. Puede agregar nuevas fuentes cuando no existan; revise duplicados antes de crear.",
    group: "Financiamiento y administracion",
    tags: ["Editable", "Operativo", "Impacta memorias"],
  },
  {
    label: "Tipo de Erogacion",
    endpoint: "/tipo-erogacion/",
    description: "Clasifica movimientos administrativos y erogaciones.",
    helpText:
      "Catalogo administrativo. Evite modificar valores usados en registros contables historicos.",
    group: "Financiamiento y administracion",
    tags: ["Sensible", "Operativo", "Impacta memorias"],
  },
  {
    label: "Tipo de Contrato",
    endpoint: "/tipo-contrato/",
    description: "Clasifica contratos usados en transferencias socio-productivas.",
    helpText:
      "Catalogo operativo. Cambie nombres solo para correcciones menores.",
    group: "Financiamiento y administracion",
    tags: ["Editable", "Operativo", "Impacta memorias"],
  },
  {
    label: "Tipo de Registro Propiedad",
    endpoint: "/tipo-registro-propiedad/",
    description: "Clasifica registros de propiedad intelectual e industrial.",
    helpText:
      "Catalogo sensible. Sus valores impactan reportes de produccion y memorias.",
    group: "Propiedad intelectual",
    tags: ["Sensible", "Impacta memorias", "Institucional"],
  },
];

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatEntityName(entityName: string) {
  return entityName
    .replace(/^el registro de\s+/i, "")
    .replace(/^la\s+/i, "")
    .replace(/^el\s+/i, "")
    .trim();
}

function isInactive(item: CatalogItem) {
  if (typeof item.activo === "boolean") return !item.activo;
  return Boolean(item.deleted_at);
}

function hasStatusData(item: CatalogItem) {
  return typeof item.activo === "boolean" || item.deleted_at !== undefined;
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-AR");
}

function getModifiedAt(item: CatalogItem) {
  return (
    formatDate(item.updated_at) ||
    formatDate(item.created_at) ||
    formatDate(item.deleted_at)
  );
}

function getCatalogSummary(items: CatalogItem[]): CatalogSummary {
  const withStatus = items.filter(hasStatusData);
  const active = withStatus.filter((item) => !isInactive(item)).length;
  const inactive = withStatus.filter(isInactive).length;
  const timestamps = items
    .map((item) => item.updated_at || item.created_at || item.deleted_at)
    .filter((value): value is string => typeof value === "string" && !!value)
    .sort();
  const latestTimestamp = timestamps[timestamps.length - 1];

  return {
    total: items.length,
    active: withStatus.length ? active : null,
    inactive: withStatus.length ? inactive : null,
    latest: latestTimestamp ? formatDate(latestTimestamp) : null,
    hasInactive: inactive > 0,
  };
}

function mapBackendMessage(
  rawMessage: string,
  action: "crear" | "actualizar" | "eliminar",
  entityName: string
) {
  const message = normalizeText(rawMessage);
  const cleanEntity = formatEntityName(entityName);

  if (message.includes("no encontrado")) {
    return `No se encontro el registro de ${cleanEntity}. Es posible que haya sido eliminado o que ya no este disponible.`;
  }

  if (message.includes("es obligatorio") || message.includes("no puede estar vacio")) {
    return `Revise la informacion ingresada para poder ${action} ${cleanEntity}.`;
  }

  if (message.includes("ya existe")) {
    return `Ya existe un registro de ${cleanEntity} con ese nombre.`;
  }

  if (
    message.includes("asociad") ||
    message.includes("esta en uso") ||
    message.includes("esta siendo utilizado")
  ) {
    return `No se puede eliminar ${cleanEntity} porque tiene registros asociados.`;
  }

  return null;
}

function getErrorMessage(
  error: unknown,
  action: "crear" | "actualizar" | "eliminar",
  entityName: string
) {
  const cleanEntity = formatEntityName(entityName);

  const fallbackMap = {
    crear: `No se pudo crear ${cleanEntity}. Verifique los datos e intente nuevamente.`,
    actualizar: `No se pudo actualizar ${cleanEntity}. Verifique los cambios e intente nuevamente.`,
    eliminar: `No se pudo eliminar ${cleanEntity}. Puede estar en uso en otros registros.`,
  };

  if (error instanceof HttpError) {
    const body = error.body as
      | { message?: string; error?: string; detail?: string }
      | string
      | undefined;

    let backendMessage = "";

    if (typeof body === "string") {
      backendMessage = body;
    } else if (body && typeof body === "object") {
      backendMessage = body.message || body.error || body.detail || "";
    }

    if (backendMessage) {
      const mapped = mapBackendMessage(backendMessage, action, entityName);
      return mapped ?? backendMessage;
    }
  }

  return fallbackMap[action];
}

function Badge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
      {children}
    </span>
  );
}

function Metric({ children }: { children: ReactNode }) {
  return <span className="text-xs text-slate-500">{children}</span>;
}

function CatalogPanel({
  def,
  onSummaryChange,
}: {
  def: CatalogDef;
  onSummaryChange: (label: string, summary: CatalogSummary) => void;
}) {
  const queryClient = useQueryClient();
  const nameField = def.nameField ?? "nombre";

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fkOptions, setFkOptions] = useState<CatalogItem[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newFkId, setNewFkId] = useState<number | "">("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editFkId, setEditFkId] = useState<number | "">("");

  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    variant: "success",
  });

  const entityLabel = def.label.toLowerCase();
  const fkLabel = def.fkField?.label ?? "";
  const fkOptionLabel = def.fkField?.optionLabel ?? "nombre";

  const showToast = (message: string, variant: "success" | "error") => {
    setToast({ open: true, message, variant });
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCatalogItems(def.endpoint);
      setItems(data);
      onSummaryChange(def.label, getCatalogSummary(data));
      setErrorMessage("");
    } catch {
      setErrorMessage(`No se pudo cargar el catalogo de ${entityLabel}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (def.fkField) {
      getCatalogItems(def.fkField.endpoint)
        .then(setFkOptions)
        .catch(() => {});
    }
  }, [def.fkField]);

  useEffect(() => {
    load();
  }, [def.endpoint]);

  const getDisplayName = (item: CatalogItem) =>
    (item[nameField] as string) ?? item.nombre ?? "-";

  const getFkDisplayName = (item: CatalogItem): string | null => {
    if (!def.fkField) return null;
    const fk = item.fuente_financiamiento as { id: number; nombre: string } | null;
    return fk?.nombre ?? null;
  };

  const getFkId = (item: CatalogItem): number | "" => {
    if (!def.fkField) return "";
    const fk = item.fuente_financiamiento as { id: number } | null;
    return fk?.id ?? "";
  };

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch = normalizeText(getDisplayName(item)).includes(
          normalizeText(search)
        );
        const matchesStatus =
          statusFilter === "all" ||
          !hasStatusData(item) ||
          (statusFilter === "active" && !isInactive(item)) ||
          (statusFilter === "inactive" && isInactive(item));

        return matchesSearch && matchesStatus;
      }),
    [items, nameField, search, statusFilter]
  );

  const hasAnyStatusData = items.some(hasStatusData);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / CATALOG_ITEMS_PER_PAGE)
  );
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * CATALOG_ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + CATALOG_ITEMS_PER_PAGE);
  }, [currentPage, filteredItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleAdd = async () => {
    if (!newName.trim()) {
      setErrorMessage("Debe ingresar un nombre antes de crear el registro.");
      return;
    }

    const body: Record<string, unknown> = { [nameField]: newName.trim() };
    if (def.descField && newDesc.trim()) body[def.descField] = newDesc.trim();
    if (def.fkField && newFkId) body[def.fkField.idField] = Number(newFkId);

    try {
      await createCatalogItem(def.endpoint, body);
      setNewName("");
      setNewDesc("");
      setNewFkId("");
      setShowAdd(false);
      setErrorMessage("");
      showToast(`El registro se creo correctamente en ${def.label}.`, "success");
      queryClient.invalidateQueries();
      load();
    } catch (error) {
      const message = getErrorMessage(error, "crear", `el registro de ${def.label}`);
      setErrorMessage(message);
      showToast(message, "error");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) {
      setErrorMessage("El nombre no puede estar vacio.");
      return;
    }

    const body: Record<string, unknown> = { [nameField]: editName.trim() };
    if (def.descField) body[def.descField] = editDesc.trim();
    if (def.fkField) body[def.fkField.idField] = editFkId ? Number(editFkId) : null;

    try {
      await updateCatalogItem(def.endpoint, id, body);
      setEditId(null);
      setErrorMessage("");
      showToast(`Los cambios se guardaron correctamente en ${def.label}.`, "success");
      queryClient.invalidateQueries();
      load();
    } catch (error) {
      const message = getErrorMessage(
        error,
        "actualizar",
        `el registro de ${def.label}`
      );
      setErrorMessage(message);
      showToast(message, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteCatalogItem(def.endpoint, deleteTarget.id);
      setDeleteTarget(null);
      setErrorMessage("");
      showToast(`El registro se elimino correctamente de ${def.label}.`, "success");
      queryClient.invalidateQueries();
      load();
    } catch (error) {
      const message = getErrorMessage(
        error,
        "eliminar",
        `el registro de ${def.label}`
      );
      setDeleteTarget(null);
      setErrorMessage(message);
      showToast(message, "error");
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-start gap-2 text-sm text-slate-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p>{def.helpText}</p>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Use la edicion solo para correcciones menores de nombre o descripcion.
          Si el significado del valor cambia, cree un nuevo valor y evite
          reutilizar el anterior.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar valor"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {(["all", "active", "inactive"] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              disabled={filter !== "all" && !hasAnyStatusData}
              onClick={() => setStatusFilter(filter)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === filter
                  ? "border-sky-200 bg-sky-50 text-sky-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {filter === "all" ? "Todos" : filter === "active" ? "Activos" : "Inactivos"}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Cargando...</p>}
      {!!errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-400 italic">Sin registros</p>
      )}

      {!loading && items.length > 0 && filteredItems.length === 0 && (
        <p className="text-sm text-slate-400 italic">
          No hay valores que coincidan con la busqueda o el filtro seleccionado.
        </p>
      )}

      {!loading && filteredItems.length > 0 && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3">
              <div className="grid grid-cols-1 gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid-cols-[1fr_160px_220px]">
                <span>Valor</span>
                <span>Estado</span>
                <span className="md:text-right">Acciones</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className={`px-5 py-4 transition-colors ${
                editId === item.id
                  ? "bg-sky-50/50"
                  : "bg-white hover:bg-slate-50"
              }`}
            >
              {editId === item.id ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Este valor puede estar asociado a registros existentes y
                      aparecer en reportes o memorias. Si modifica su nombre,
                      podria afectar la visualizacion historica.
                    </p>
                  </div>

                  <Field
                    label={def.nameField === "nombre_beca" ? "Nombre de la beca" : "Nombre"}
                  >
                    <input
                      className="input"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && handleUpdate(item.id)}
                      autoFocus
                    />
                  </Field>

                  {def.descField && (
                    <Field label="Descripcion">
                      <input
                        className="input"
                        value={editDesc}
                        placeholder="Descripcion"
                        onChange={(event) => setEditDesc(event.target.value)}
                      />
                    </Field>
                  )}

                  {def.fkField && (
                    <Field label={fkLabel}>
                      <select
                        className="input"
                        value={editFkId}
                        onChange={(event) =>
                          setEditFkId(event.target.value ? +event.target.value : "")
                        }
                      >
                        <option value="">Sin {fkLabel.toLowerCase()}</option>
                        {fkOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {String(option[fkOptionLabel] ?? option.nombre)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditId(null)}
                    >
                      Cancelar
                    </Button>
                    <Button type="button" size="sm" onClick={() => handleUpdate(item.id)}>
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-800">
                      {getDisplayName(item)}
                    </p>
                    {(def.descField && typeof item[def.descField] === "string") ||
                    getFkDisplayName(item) ? (
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {def.descField && typeof item[def.descField] === "string" && (
                          <span>{item[def.descField] as string}</span>
                        )}
                        {def.descField &&
                          typeof item[def.descField] === "string" &&
                          getFkDisplayName(item) && <span> · </span>}
                        {getFkDisplayName(item) && (
                          <span>
                            {fkLabel}: {getFkDisplayName(item)}
                          </span>
                        )}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <div>
                      {hasStatusData(item) ? (
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                            isInactive(item)
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isInactive(item) ? "Inactivo" : "Activo"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Estado no informado
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      {getModifiedAt(item)
                        ? `Modificado ${getModifiedAt(item)}`
                        : "Sin fecha disponible"}
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditId(item.id);
                        setEditName(getDisplayName(item));
                        setEditDesc(def.descField ? ((item[def.descField] as string) ?? "") : "");
                        setEditFkId(getFkId(item));
                        setErrorMessage("");
                      }}
                      title="Editar"
                    >
                      <span className="flex items-center gap-1.5">
                        <Pencil size={14} /> Editar
                      </span>
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setDeleteTarget(item)}
                      className="text-red-600 hover:bg-red-50"
                      title="Eliminar"
                    >
                      <span className="flex items-center gap-1.5">
                        <Trash2 size={14} /> Eliminar
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Mostrando {paginatedItems.length} de {filteredItems.length} valores
              </span>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  Anterior
                </Button>

                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  Pagina {currentPage} de {totalPages}
                </span>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {showAdd ? (
        <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/30 px-4 py-4">
          <Field
            label={def.nameField === "nombre_beca" ? "Nombre de la beca" : "Nombre"}
            required
          >
            <input
              className="input"
              placeholder="Nombre"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleAdd()}
              autoFocus
            />
          </Field>

          {def.descField && (
            <Field label="Descripcion">
              <input
                className="input"
                placeholder="Descripcion"
                value={newDesc}
                onChange={(event) => setNewDesc(event.target.value)}
              />
            </Field>
          )}

          {def.fkField && (
            <Field label={fkLabel}>
              <select
                className="input"
                value={newFkId}
                onChange={(event) =>
                  setNewFkId(event.target.value ? +event.target.value : "")
                }
              >
                <option value="">Sin {fkLabel.toLowerCase()}</option>
                {fkOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {String(option[fkOptionLabel] ?? option.nombre)}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowAdd(false);
                setNewName("");
                setNewDesc("");
                setNewFkId("");
                setErrorMessage("");
              }}
            >
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleAdd}>
              Crear
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setShowAdd(true);
            setErrorMessage("");
          }}
        >
          <span className="flex items-center gap-2">
            <Plus size={16} /> Agregar nuevo
          </span>
        </Button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar registro"
        message={`Antes de eliminar "${
          deleteTarget ? getDisplayName(deleteTarget) : ""
        }", verifique que no este asociado a registros historicos o memorias. Si esta en uso, el sistema puede bloquear la operacion.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <SuccessToast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() =>
          setToast({
            open: false,
            message: "",
            variant: "success",
          })
        }
      />
    </div>
  );
}

export default function CatalogosHome() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [catalogSummaries, setCatalogSummaries] = useState<Record<string, CatalogSummary>>(
    {}
  );
  const [pageSearch, setPageSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<CatalogTag | "Todos">("Todos");
  const [activeGroup, setActiveGroup] = useState<CatalogGroupFilter>("Todos");

  const availableTags = useMemo(
    () => Array.from(new Set(CATALOGS.flatMap((catalog) => catalog.tags))),
    []
  );

  const catalogMatchesSearchAndTag = useMemo(
    () =>
      CATALOGS.filter((catalog) => {
        const matchesText =
          normalizeText(catalog.label).includes(normalizeText(pageSearch)) ||
          normalizeText(catalog.description).includes(normalizeText(pageSearch));
        const matchesTag = tagFilter === "Todos" || catalog.tags.includes(tagFilter);
        return matchesText && matchesTag;
      }),
    [pageSearch, tagFilter]
  );

  const visibleCatalogs = useMemo(
    () =>
      catalogMatchesSearchAndTag.filter(
        (catalog) => activeGroup === "Todos" || catalog.group === activeGroup
      ),
    [activeGroup, catalogMatchesSearchAndTag]
  );

  const groupCounts = useMemo(() => {
    const counts: Record<CatalogGroupFilter, number> = {
      Todos: catalogMatchesSearchAndTag.length,
      "Institucionales / normativos": 0,
      Operativos: 0,
      "Financiamiento y administracion": 0,
      "Propiedad intelectual": 0,
    };

    catalogMatchesSearchAndTag.forEach((catalog) => {
      counts[catalog.group] += 1;
    });

    return counts;
  }, [catalogMatchesSearchAndTag]);

  useEffect(() => {
    if (activeGroup !== "Todos" && groupCounts[activeGroup] === 0) {
      setActiveGroup("Todos");
    }
  }, [activeGroup, groupCounts]);

  const toggle = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSummaryChange = (label: string, summary: CatalogSummary) => {
    setCatalogSummaries((prev) => ({ ...prev, [label]: summary }));
  };

  return (
    <section className="w-full min-h-[calc(100vh-120px)] px-4 py-4 flex flex-col">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold md:text-3xl">
            Gestionar Catalogos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Organice valores reutilizados por formularios, reportes y memorias.
          </p>
        </div>

        <Button type="button" variant="secondary" size="sm" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm text-sm text-slate-600">
        <p>
          Esta vista muestra solo metricas disponibles desde los endpoints
          actuales. Usos, origen e historial requieren soporte backend
          especifico y se mantienen como mejoras pendientes.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["Todos", ...CATALOG_GROUPS] as CatalogGroupFilter[]).map((group) => (
              <button
                key={group}
                type="button"
                disabled={groupCounts[group] === 0}
                onClick={() => setActiveGroup(group)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  activeGroup === group
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {group}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    activeGroup === group
                      ? "bg-white/15 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {groupCounts[group]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Buscar catalogo"
              value={pageSearch}
              onChange={(event) => setPageSearch(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["Todos", ...availableTags] as Array<CatalogTag | "Todos">).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTagFilter(tag)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  tagFilter === tag
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {CATALOG_GROUPS.map((group) => {
          const groupCatalogs = visibleCatalogs.filter(
            (catalog) => catalog.group === group
          );

          if (!groupCatalogs.length) return null;

          return (
            <div key={group} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {group}
              </h3>

              {groupCatalogs.map((catalog) => {
                const isOpen = !!expanded[catalog.label];
                const summary = catalogSummaries[catalog.label];

                return (
                  <div
                    key={catalog.label}
                    className="overflow-hidden rounded-xl"
                  >
                    <Tarjeta
                      item={catalog}
                      onClick={() => toggle(catalog.label)}
                      className={isOpen ? "rounded-b-none border-b-0" : ""}
                      title={() => (
                        <div className="flex items-center gap-2">
                          <span>{catalog.label}</span>
                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      )}
                      subtitle={() => (
                        <div className="space-y-3">
                          <p>{catalog.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {summary?.hasInactive && <Badge>Con inactivos</Badge>}
                            {catalog.tags.map((tag) => (
                              <Badge key={tag}>{tag}</Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            {summary ? (
                              <>
                                <Metric>{summary.total} valores</Metric>
                                {summary.active !== null && (
                                  <Metric>{summary.active} activos</Metric>
                                )}
                                {summary.inactive !== null && (
                                  <Metric>{summary.inactive} inactivos</Metric>
                                )}
                                <Metric>usos no disponibles</Metric>
                                {summary.latest ? (
                                  <Metric>
                                    ultima modificacion {summary.latest}
                                  </Metric>
                                ) : (
                                  <Metric>ultima modificacion no disponible</Metric>
                                )}
                              </>
                            ) : (
                              <Metric>Abrir para cargar metricas disponibles</Metric>
                            )}
                          </div>
                        </div>
                      )}
                    />

                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white/80 px-6 pb-6">
                        {isOpen && (
                          <CatalogPanel
                            def={catalog}
                            onSummaryChange={handleSummaryChange}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {visibleCatalogs.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
            No hay catalogos que coincidan con la busqueda o el filtro
            seleccionado.
          </div>
        )}

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={scrollToPageTop}
            className="flex items-center gap-2"
          >
            <ArrowUp className="h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </section>
  );
}
