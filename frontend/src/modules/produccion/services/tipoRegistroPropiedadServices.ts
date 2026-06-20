import { http } from "@/lib/http";

export interface TipoRegistroPropiedad {
  id: number;
  nombre: string;
}

export async function getTiposRegistroPropiedad(): Promise<TipoRegistroPropiedad[]> {
  return http("/tipo-registro-propiedad/");
}
