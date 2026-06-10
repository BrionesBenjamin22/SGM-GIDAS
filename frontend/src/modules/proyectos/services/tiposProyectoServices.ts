import { http } from "@/lib/http";

export type TipoProyecto = {
  id: number;
  nombre: string;
};

/* =========================
   GET ALL
========================= */
export async function getTiposProyecto(): Promise<TipoProyecto[]> {
  const data = await http<any[]>("/tipos-proyecto/");

  return data.map((t) => ({
    id: t.id,
    nombre: t.nombre,
  }));
}

/* =========================
   CREATE
========================= */
export async function createTipoProyecto(
  nombre: string
): Promise<TipoProyecto> {
  const data = await http<any>("/tipos-proyecto/", {
    method: "POST",
    body: JSON.stringify({ nombre }),
  });

  return {
    id: data.id,
    nombre: data.nombre,
  };
}
