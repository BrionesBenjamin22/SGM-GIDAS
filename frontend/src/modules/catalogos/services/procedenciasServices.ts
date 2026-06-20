import {http} from "@/lib/http";

export interface Procedencia {
  id: number;
  nombre: string;
}

export const getProcedencias = async (): Promise<Procedencia[]> => {
  return http<Procedencia[]>("/procedencias/", {
    method: "GET",
  });
};
