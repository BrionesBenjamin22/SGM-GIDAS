import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus, Pencil, Trash2 } from "lucide-react";
import {
  getCatalogItems,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  type CatalogItem,
} from "@/services/catalogoServices";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import Button from "@/components/Button";
import Field from "@/components/Field";
import ErrorText from "@/components/ErrorText";
import { HttpError } from "@/lib/http";

/* ───── Catalog definitions ───── */

type FkField = {
  idField: string;
  label: string;
  endpoint: string;
  optionLabel?: string;
};

type CatalogDef = {
  label: string;
  endpoint: string;
  nameField?: string;
  descField?: string;
  fkField?: FkField;
};

const CATALOGS: CatalogDef[] = [
  {
    label: "Becas",
    endpoint: "/becas/",
    nameField: "nombre_beca",
    descField: "descripcion",
    fkField: {
      idField: "fuente_financiamiento_id",
      label: "Fuente de Financiamiento",
      endpoint: "/fuente-financiamiento/",
    },
  },
  { label: "Cargos", endpoint: "/cargos/" },
  { label: "Tipo de Personal", endpoint: "/tipo-personal/" },
  { label: "Nivel de Formación", endpoint: "/tipo-formacion/" },
  { label: "Categoría UTN", endpoint: "/categoria-utn/" },
  { label: "Tipo de Dedicación", endpoint: "/tipo-dedicacion/" },
  { label: "Fuente de Financiamiento", endpoint: "/fuente-financiamiento/" },
  { label: "Programa de Incentivos", endpoint: "/programas-incentivos/" },
  { label: "Tipo de Proyecto", endpoint: "/tipo-proyecto/" },
  { label: "Tipo de Erogación", endpoint: "/tipo-erogacion/" },
  { label: "Tipo de Contrato", endpoint: "/tipo-contrato/" },
  { label: "Tipo de Registro Propiedad", endpoint: "/tipo-registro-propiedad/" },
  { label: "Tipo de Reunión Científica", endpoint: "/tipos-reunion-cientifica/" },
  { label: "Grado Académico", endpoint: "/grado-academico" },
  { label: "Rol de Actividad", endpoint: "/rol-actividad" },
];

type ToastState = {
  open: boolean;
  message: string;
  variant: "success" | "error";
};

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

function getActionInfinitive(action: "crear" | "actualizar" | "eliminar") {
  return action;
}

function mapBackendMessage(
  rawMessage: string,
  action: "crear" | "actualizar" | "eliminar",
  entityName: string
) {
  const message = normalizeText(rawMessage);
  const cleanEntity = formatEntityName(entityName);
  const actionText = getActionInfinitive(action);

  // ID inválido
  if (
    message.includes("el id debe ser un entero positivo") ||
    message.includes("id debe ser un entero positivo")
  ) {
    return `El identificador de ${cleanEntity} no es válido.`;
  }

  // No encontrado
  if (message.includes("no encontrado")) {
    return `No se encontró el registro de ${cleanEntity}. Es posible que haya sido eliminado o que ya no esté disponible.`;
  }

  // Campo requerido
  if (message.includes("es obligatorio")) {
    return `Completá el campo obligatorio para poder ${actionText} ${cleanEntity}.`;
  }

  // Campo vacío
  if (
    message.includes("no puede estar vacio") ||
    message.includes("los datos no pueden estar vacios")
  ) {
    return `Revisá la información ingresada: hay campos obligatorios vacíos en ${cleanEntity}.`;
  }

  // Tipo inválido
  if (message.includes("debe ser texto")) {
    return `El nombre ingresado para ${cleanEntity} no tiene un formato válido.`;
  }

  // Longitud mínima
  if (message.includes("al menos 2 caracteres")) {
    return `El nombre de ${cleanEntity} debe tener al menos 2 caracteres.`;
  }

  // Duplicado
  if (message.includes("ya existe")) {
    return `Ya existe un registro de ${cleanEntity} con ese nombre.`;
  }

  // Relaciones asociadas
  if (
    message.includes("tiene actividades asociadas") ||
    message.includes("tiene transferencias asociadas") ||
    message.includes("tiene registros asociados") ||
    message.includes("tiene proyectos asociados") ||
    message.includes("tiene elementos asociados") ||
    message.includes("tiene becas asociadas") ||
    message.includes("tiene contratos asociados") ||
    message.includes("tiene erogaciones asociadas") ||
    message.includes("tiene personal asociado") ||
    message.includes("tiene documentaciones asociadas") ||
    message.includes("tiene reuniones asociadas") ||
    message.includes("esta en uso") ||
    message.includes("esta siendo utilizado") ||
    message.includes("esta siendo usada") ||
    message.includes("esta asociado") ||
    message.includes("esta asociada")
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
    crear: `No se pudo crear ${cleanEntity}. Verificá los datos e intentá nuevamente.`,
    actualizar: `No se pudo actualizar ${cleanEntity}. Verificá los cambios e intentá nuevamente.`,
    eliminar: `No se pudo eliminar ${cleanEntity}. Puede estar en uso en otros registros.`,
  };

  const friendly500Map = {
    crear: `Hubo un error interno al intentar crear ${cleanEntity}. Intentá nuevamente más tarde o contactá al administrador si el problema persiste.`,
    actualizar: `Hubo un error interno al intentar actualizar ${cleanEntity}. Intentá nuevamente más tarde o contactá al administrador si el problema persiste.`,
    eliminar: `Hubo un error interno al intentar eliminar ${cleanEntity}. Intentá nuevamente más tarde o contactá al administrador si el problema persiste.`,
  };

  if (error instanceof HttpError) {
    if (error.status === 500) {
      return friendly500Map[action];
    }

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
      if (mapped) return mapped;
      return backendMessage;
    }

    if (error.status === 404) {
      return `No se encontró el registro de ${cleanEntity}.`;
    }

    if (error.status === 400) {
      return `Los datos ingresados para ${cleanEntity} no son válidos. Revisalos e intentá nuevamente.`;
    }
  }

  return fallbackMap[action];
}

/* ───── Single catalog CRUD panel ───── */

function CatalogPanel({ def }: { def: CatalogDef }) {
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

  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    variant: "success",
  });

  const [errorMessage, setErrorMessage] = useState("");

  const entityLabel = def.label.toLowerCase();

  const showToast = (message: string, variant: "success" | "error") => {
    setToast({
      open: true,
      message,
      variant,
    });
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCatalogItems(def.endpoint);
      setItems(data);
      setErrorMessage("");
    } catch {
      setErrorMessage(`No se pudo cargar el catálogo de ${entityLabel}.`);
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
  }, [def.fkField?.endpoint]);

  useEffect(() => {
    load();
  }, [def.endpoint]);

  const handleAdd = async () => {
    if (!newName.trim()) {
      setErrorMessage("Debés ingresar un nombre antes de crear el registro.");
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
      showToast(`El registro se creó correctamente en ${def.label}.`, "success");
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
      setErrorMessage("El nombre no puede estar vacío.");
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
      const message = getErrorMessage(error, "actualizar", `el registro de ${def.label}`);
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
      showToast(`El registro se eliminó correctamente de ${def.label}.`, "success");
      queryClient.invalidateQueries();
      load();
    } catch (error) {
      const message = getErrorMessage(error, "eliminar", `el registro de ${def.label}`);
      setDeleteTarget(null);
      setErrorMessage(message);
      showToast(message, "error");
    }
  };

  const getDisplayName = (item: CatalogItem) =>
    (item[nameField] as string) ?? item.nombre ?? "—";

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

  const fkLabel = def.fkField?.label ?? "";
  const fkOptionLabel = def.fkField?.optionLabel ?? "nombre";

  return (
    <div className="space-y-4 pt-4">
      {loading && <p className="text-sm text-slate-400">Cargando…</p>}

      {!!errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-400 italic">Sin registros</p>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border px-4 py-3 transition-colors ${
                editId === item.id
                  ? "border-sky-200 bg-sky-50/50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              {editId === item.id ? (
                <div className="space-y-3">
                  <Field label={def.nameField === "nombre_beca" ? "Nombre de la beca" : "Nombre"}>
                    <input
                      className="input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate(item.id)}
                      autoFocus
                    />
                  </Field>

                  {def.descField && (
                    <Field label="Descripción">
                      <input
                        className="input"
                        value={editDesc}
                        placeholder="Descripción"
                        onChange={(e) => setEditDesc(e.target.value)}
                      />
                    </Field>
                  )}

                  {def.fkField && (
                    <Field label={fkLabel}>
                      <select
                        className="input"
                        value={editFkId}
                        onChange={(e) => setEditFkId(e.target.value ? +e.target.value : "")}
                      >
                        <option value="">Sin {fkLabel.toLowerCase()}</option>
                        {fkOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {String(opt[fkOptionLabel] ?? opt.nombre)}
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
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleUpdate(item.id)}
                    >
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {getDisplayName(item)}
                    </p>

                    {(def.descField && typeof item[def.descField] === "string") || getFkDisplayName(item) ? (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {def.descField && typeof item[def.descField] === "string" && (
                          <span>{item[def.descField] as string}</span>
                        )}
                        {def.descField && typeof item[def.descField] === "string" && getFkDisplayName(item) && (
                          <span> · </span>
                        )}
                        {getFkDisplayName(item) && (
                          <span>
                            {fkLabel}: {getFkDisplayName(item)}
                          </span>
                        )}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditId(item.id);
                        setEditName(getDisplayName(item));
                        setEditDesc(
                          def.descField ? ((item[def.descField] as string) ?? "") : ""
                        );
                        setEditFkId(getFkId(item));
                        setErrorMessage("");
                      }}
                      className="p-2 rounded-lg hover:bg-sky-50 text-sky-600 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 px-4 py-4 space-y-3">
          <Field label={def.nameField === "nombre_beca" ? "Nombre de la beca" : "Nombre"} required>
            <input
              className="input"
              placeholder="Nombre"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
          </Field>

          {def.descField && (
            <Field label="Descripción">
              <input
                className="input"
                placeholder="Descripción"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </Field>
          )}

          {def.fkField && (
            <Field label={fkLabel}>
              <select
                className="input"
                value={newFkId}
                onChange={(e) => setNewFkId(e.target.value ? +e.target.value : "")}
              >
                <option value="">Sin {fkLabel.toLowerCase()}</option>
                {fkOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {String(opt[fkOptionLabel] ?? opt.nombre)}
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
        message={`¿Estás seguro de eliminar "${deleteTarget ? getDisplayName(deleteTarget) : ""}"?`}
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

/* ───── Main page ───── */

export default function CatalogosHome() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <section className="w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-semibold leading-none">
          Gestionar Catálogos
        </h2>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {CATALOGS.map((cat) => {
          const isOpen = !!expanded[cat.label];

          return (
            <div
              key={cat.label}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
            >
              <button
                onClick={() => toggle(cat.label)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors"
              >
                <span className="text-sm font-medium text-slate-800">
                  {cat.label}
                </span>

                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6 border-t border-slate-100">
                  {isOpen && <CatalogPanel def={cat} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}