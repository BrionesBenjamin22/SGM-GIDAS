import { http } from "@/lib/http";

export interface Proyecto {
  id: number;
  codigo: string;
  nombre: string;
}

type ProyectoApiResponse = {
  id: number;
  codigo_proyecto: string | number;
  nombre_proyecto: string;
};

export const getProyectos = async (): Promise<Proyecto[]> => {
  const data = await http<ProyectoApiResponse[]>("/proyectos/");
  return data.map((p) => ({
    id: p.id,
    codigo: String(p.codigo_proyecto),
    nombre: p.nombre_proyecto,
  }));
};
