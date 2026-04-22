import { http } from "@/lib/http";

export interface TipoReunion {
  id: number;
  nombre: string;
}

export const getTiposReunion = async (): Promise<TipoReunion[]> => {
  return http("/tipos-reunion-cientifica/", {
    method: "GET",
  });
};