// src/services/directivoServices.ts
import { http } from "@/lib/http";

export type Directivo = {
  id: number;
  nombre_apellido: string;
};

export type DirectivoActual = {
  id: number;
  id_directivo: number;
  nombre_apellido: string;
  cargo: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
};

export type UpdateDirectivoPayload = {
  nombre_apellido: string;
};

export type FinalizarDirectivoPayload = {
  id_grupo_utn: number;
  id_directivo: number;
  fecha_fin: string;
};

export function getDirectivos() {
  return http<Directivo[]>("/directivos", {
    method: "GET",
  });
}

export function createDirectivo(payload: {
  nombre_apellido: string;
}) {
  return http<Directivo>("/directivos/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function asignarDirectivo(payload: {
  id_directivo: number;
  id_grupo_utn: number;
  id_cargo: number;
  fecha_inicio: string;
}) {
  return http<{ message: string }>("/directivos/asignar", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getDirectivosActuales(grupoId: number) {
  return http<DirectivoActual[]>(`/directivos/grupo/${grupoId}/actuales`, {
    method: "GET",
  });
}

export function updateDirectivo(
  directivoId: number,
  payload: UpdateDirectivoPayload
) {
  return http<{ message: string }>(`/directivos/${directivoId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function finalizarDirectivo(payload: FinalizarDirectivoPayload) {
  return http<{ message: string }>("/directivos/finalizar", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}