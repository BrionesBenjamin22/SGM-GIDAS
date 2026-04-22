import { http } from "@/lib/http";

// ─── Tipos ───────────────────────────────────────────────────

export interface TipoContratoItem {
  id: number;
  nombre: string;
}

/** Los 6 tipos de contrato definidos en la especificación (fallback estático). */
export const TIPOS_CONTRATO_STATIC = [
  "Transferencia de Tecnología",
  "I+D+i",
  "Transferencia de conocimientos",
  "Asistencia Técnica o consultoría",
  "Servicios Técnicos / de apoyo / supervisión y/o Ensayos de Laboratorio",
  "Difusión a la comunidad académica y general",
] as const;

// ─── Helpers ─────────────────────────────────────────────────

/** Devuelve `true` cuando el frontend opera sin backend (modo mock). */
export function isMockMode(): boolean {
  const url = import.meta.env.VITE_API_URL;
  return !url || url === "";
}

// ─── API ─────────────────────────────────────────────────────

/** Obtener los tipos de contrato del backend. */
export async function getTiposContrato(): Promise<TipoContratoItem[]> {
  /** Forzar modo mock (poner false cuando el backend esté listo). */
  const FORCE_MOCK = false;
  if (FORCE_MOCK || isMockMode()) {
    return TIPOS_CONTRATO_STATIC.map((nombre, i) => ({
      id: i + 1,
      nombre,
    }));
  }
  return http<TipoContratoItem[]>("/tipo-contrato/");
}
