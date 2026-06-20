import { http } from "@/lib/http";

export type Planificacion = {
  id: number;
  descripcion: string;
};

export async function getPlanificaciones(): Promise<Planificacion[]> {
  const data = await http<any[]>("/planificaciones/");

  return data.map((p) => ({
    id: p.id,
    descripcion: p.descripcion,
  }));
}
