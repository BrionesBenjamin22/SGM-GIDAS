import { http } from "@/lib/http";
import { MOCK_PROYECTOS } from "@/modules/shared/services/mockData";

export interface Proyecto {
  id: number;
  codigo: string;
  nombre: string;
}

export const getProyectos = async (): Promise<Proyecto[]> => {
  try {
    const data = await http<any[]>("/proyectos/");
    return data.map((p) => ({
      id: p.id,
      codigo: String(p.codigo_proyecto),
      nombre: p.nombre_proyecto,
    }));
  } catch (error) {
    console.warn("Error fetching proyectos, using mock data:", error);
    return MOCK_PROYECTOS;
  }
};
