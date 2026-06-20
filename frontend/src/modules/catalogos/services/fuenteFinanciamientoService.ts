import { http } from "@/lib/http";

export type FuenteFinanciamiento = {
  id: number;
  nombre: string;
};

export async function getFuentesFinanciamiento() {
  return http<FuenteFinanciamiento[]>("/fuente-financiamiento/");
}
