import { http } from "@/lib/http";

export type TipoErogacion = {
  id: number;
  nombre: string;
};

export async function getTiposErogacion() {
  return http<TipoErogacion[]>("/tipo-erogacion/");
}
