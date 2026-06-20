import {http} from "@/lib/http";

export interface TipoVisita {
  id: number;
  nombre: string;
}

export const getTiposVisita = async (): Promise<TipoVisita[]> => {
  return http<TipoVisita[]>("/tipos-reunion-cientifica/", {
    method: "GET",
  });
};
