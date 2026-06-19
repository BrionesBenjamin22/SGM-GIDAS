import { http } from "@/lib/http";

export interface Tipo {
  id: number;
  nombre: string;
}

export const getTiposPersonal = () =>
  http<Tipo[]>("/tipo-personal/");

export const getTiposFormacion = () =>
  http<Tipo[]>("/tipo-formacion/");

export const getDedicaciones = () =>
  http<Tipo[]>("/tipo-dedicacion/");
