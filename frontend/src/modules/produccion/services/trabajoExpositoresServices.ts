import { http } from "@/lib/http";

export type ExpositorReferencia =
  | { rol: "investigador" | "becario" | "personal"; id: number }
  | { rol: "externo"; nombre_apellido: string };
export interface Expositor {
  rol: "investigador" | "becario" | "personal" | "externo";
  id: number | null;
  identidad_id?: number | null;
  nombre_apellido: string;
  tipo: string;
  activo: boolean;
}

export const normalizarNombreExpositor = (nombre: string) => nombre.trim().replace(/\s+/g, " ");
export const nombreExpositorClave = (nombre: string) => normalizarNombreExpositor(nombre).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export const expositorClave = (persona: Pick<Expositor, "rol" | "id"> & { nombre_apellido?: string }) =>
  persona.rol === "externo" ? `externo:${nombreExpositorClave(persona.nombre_apellido ?? "")}` : `${persona.rol}:${persona.id}`;
export const expositorEtiqueta = (persona: Expositor) => `${persona.nombre_apellido} (${persona.tipo})`;
export const expositorReferencia = (persona: Expositor): ExpositorReferencia => persona.rol === "externo"
  ? { rol: "externo", nombre_apellido: normalizarNombreExpositor(persona.nombre_apellido) }
  : { rol: persona.rol, id: persona.id! };
export const mismosExpositores = (a: Expositor[], b: Expositor[]) =>
  a.length === b.length && a.every(persona => b.some(otro => expositorClave(persona) === expositorClave(otro)));
export function errorExpositores(value: Expositor[], obligatorio = true): string | undefined {
  if (obligatorio && !value.length) return "Agregue al menos un expositor.";
  const claves = value.map(expositorClave);
  const identidades = value.flatMap(persona => persona.identidad_id == null ? [] : [persona.identidad_id]);
  if (new Set(claves).size !== claves.length || new Set(identidades).size !== identidades.length) return "Quite el expositor repetido.";
  for (const persona of value) {
    if (persona.rol === "externo") {
      const nombre = normalizarNombreExpositor(persona.nombre_apellido);
      if (nombre.length < 2 || nombre.length > 120 || !/\p{L}/u.test(nombre) || /\p{C}/u.test(nombre)) return "Ingrese un nombre externo válido de entre 2 y 120 caracteres.";
    } else if (!["investigador", "becario", "personal"].includes(persona.rol) || !Number.isInteger(persona.id) || persona.id! <= 0) return "Seleccione una referencia interna válida.";
  }
}

export async function getIntegrantesExpositores(grupoId: number): Promise<Expositor[]> {
  const personas = await http<Array<Expositor & { grupo_utn_id: number; deleted_at?: string | null; tipo_personal?: string }>>("/personal-all?activos=true");
  return personas.filter(persona => ["investigador", "becario", "personal"].includes(persona.rol) && persona.activo && !persona.deleted_at && persona.grupo_utn_id === grupoId)
    .map(persona => ({ id: persona.id, rol: persona.rol, identidad_id: persona.identidad_id,
      nombre_apellido: persona.nombre_apellido, activo: persona.activo,
      tipo: persona.rol === "investigador" ? "Investigador" : persona.rol === "becario" ? "Becario" : persona.tipo_personal || "Personal" }));
}
