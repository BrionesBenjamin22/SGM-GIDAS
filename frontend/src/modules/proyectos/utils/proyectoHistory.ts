import type { HistorialProyectoItem } from "@/modules/proyectos/services/proyectosServices";

type HistoryPresentation = { title: string; description: string };

type ProyectoPersonal = {
  investigadores?: Array<{ id: number; nombre_apellido: string }>;
  becarios?: Array<{ id: number; nombre_apellido: string }>;
};

const FIELD_LABELS: Record<string, string> = {
  codigo_proyecto: "Código del proyecto",
  nombre_proyecto: "Nombre del proyecto",
  descripcion_proyecto: "Descripción",
  dificultades_proyecto: "Dificultades",
  monto_destinado: "Monto destinado",
  fecha_inicio: "Fecha de inicio",
  fecha_fin: "Fecha de finalización",
  tipo_proyecto_id: "Tipo de proyecto",
  fuente_financiamiento_id: "Fuente de financiamiento",
  coordinador_id: "Coordinador",
  investigadores: "Investigadores",
  investigadores_ids: "Investigadores",
  becarios: "Becarios",
  becarios_ids: "Becarios",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function label(value?: string) {
  if (!value) return "Cambio";
  return FIELD_LABELS[value] ?? value.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function valueLabel(value: unknown, field?: string) {
  if (value === null || value === undefined || value === "") return "Sin dato";
  if (field === "fecha_inicio" || field === "fecha_fin") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
    return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value);
  }
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

function relationEvent(
  entry: HistorialProyectoItem,
  personal?: ProyectoPersonal
): HistoryPresentation | null {
  if (!isRecord(entry.valor_nuevo) || typeof entry.valor_nuevo.accion !== "string") return null;
  const detail = isRecord(entry.valor_nuevo.detalle) ? entry.valor_nuevo.detalle : {};
  const actionLabels: Record<string, string> = { vincular: "vinculado", desvincular: "desvinculado", actualizar: "actualizado" };
  const action = actionLabels[entry.valor_nuevo.accion] ?? entry.valor_nuevo.accion;
  const isBecario = entry.campo === "becarios" || entry.campo === "becarios_ids";
  const singular = isBecario ? "Becario" : "Investigador";
  const collection = isBecario ? personal?.becarios : personal?.investigadores;
  const id = typeof detail.id === "number" ? detail.id : null;
  const storedName = typeof detail.nombre_apellido === "string" ? detail.nombre_apellido.trim() : "";
  const currentName = id === null ? "" : collection?.find((item) => item.id === id)?.nombre_apellido ?? "";
  return { title: `${singular} ${action}`, description: storedName || currentName || singular };
}

export function formatProyectoHistoryEntry(
  entry: HistorialProyectoItem,
  personal?: ProyectoPersonal
): HistoryPresentation {
  if (["investigadores", "investigadores_ids", "becarios", "becarios_ids"].includes(entry.campo ?? "")) {
    const relation = relationEvent(entry, personal);
    if (relation) return relation;
  }
  return { title: label(entry.campo || entry.tipo), description: `${valueLabel(entry.valor_anterior, entry.campo)} → ${valueLabel(entry.valor_nuevo, entry.campo)}` };
}

export function presentProyectoHistoryItem(
  entry: HistorialProyectoItem,
  personal?: ProyectoPersonal
): HistorialProyectoItem {
  const isRelation = ["investigadores", "investigadores_ids", "becarios", "becarios_ids"].includes(entry.campo ?? "");
  if (!isRelation || !isRecord(entry.valor_nuevo) || typeof entry.valor_nuevo.accion !== "string") return entry;

  const presentation = formatProyectoHistoryEntry(entry, personal);
  return {
    ...entry,
    campo: presentation.title,
    valor_anterior: null,
    valor_nuevo: presentation.description,
  };
}
