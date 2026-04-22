import { http } from "@/lib/http";

export interface BecarioPayload {
  nombre_apellido: string;
  horas_semanales: number;
  grupo_utn_id: number;
  tipo_formacion_id: number;
  activo: boolean;
}

export interface BecarioBeca {
  id: number;
  nombre_beca: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  monto_percibido?: number;
}

export interface Becario {
  id: number;
  nombre_apellido: string;
  horas_semanales: number;
  grupo_utn_id: number;
  tipo_formacion_id: number;
  fuente_financiamiento_id?: number;
  activo: boolean;
  becas?: BecarioBeca[];
}

export function crearBecario(payload: BecarioPayload) {
  return http("/becarios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function actualizarBecario(id: number, payload: any) {
  return http(`/becarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getBecarios() {
  return http<Becario[]>("/becarios", {
    method: "GET",
  });
}

export function getBecarioById(id: number) {
  return http<Becario>(`/becarios/${id}`, {
    method: "GET",
  });
}