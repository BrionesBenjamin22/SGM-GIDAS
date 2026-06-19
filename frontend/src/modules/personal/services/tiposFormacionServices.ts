import { http } from "@/lib/http";

export interface TipoFormacion {
  id: number;
  nombre: string;
}

export function getTiposFormacion() {
  return http<TipoFormacion[]>("/tipo-formacion/");
}
