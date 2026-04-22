import { http } from "@/lib/http";
import {
  MOCK_DISTINCIONES,
  MOCK_PROYECTOS,
  type Distincion as BaseDistincion,
} from "./mockData";

const STORAGE_KEY = "gidas_distinciones_v3";
const PROYECTOS_KEY = "gidas_proyectos_v3";

export interface Distincion extends BaseDistincion {
  created_by?: number | null;
  created_by_nombre?: string | null;
  created_at?: string | null;
  deleted_by?: number | null;
  deleted_by_nombre?: string | null;
  deleted_at?: string | null;
}

const getLocalStorageData = (): Distincion[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) return JSON.parse(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DISTINCIONES));
  return MOCK_DISTINCIONES;
};

const saveToLocalStorage = (data: Distincion[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const generateLocalId = (): number => {
  const data = getLocalStorageData();
  const maxId = data.reduce((max, item) => Math.max(max, Math.abs(item.id)), 0);
  return -(maxId + 1);
};

export interface DistincionPayload {
  fecha: string;
  descripcion: string;
  proyecto_investigacion_id?: number;
}

type GetDistincionesOptions = {
  proyectoId?: number;
  activos?: "true" | "false" | "all";
  orden?: "asc" | "desc";
};

export const getDistinciones = async (
  options: GetDistincionesOptions = {}
): Promise<Distincion[]> => {
  const {
    proyectoId,
    activos,
    orden = "asc",
  } = options;

  try {
    const params = new URLSearchParams();
    if (proyectoId) params.append("proyecto_id", String(proyectoId));
    if (activos) params.append("activos", activos);
    params.append("orden", orden);
    const query = params.toString() ? `?${params.toString()}` : "";
    return await http<Distincion[]>(`/distinciones/${query}`, { method: "GET" });
  } catch (error) {
    console.warn("Error fetching distinciones, using local data:", error);
    let data = getLocalStorageData();
    if (proyectoId) {
      data = data.filter(d => d.proyecto_investigacion_id === proyectoId);
    }
    if (orden === "desc") {
      data = [...data].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    } else {
      data = [...data].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    }
    return data;
  }
};

export const getDistincionById = async (id: number): Promise<Distincion> => {
  try {
    return await http<Distincion>(`/distinciones/${id}`, { method: "GET" });
  } catch (error) {
    console.warn("Error fetching distincion by id, using local data:", error);
    const data = getLocalStorageData();
    const item = data.find(d => d.id === id);
    if (!item) throw new Error("Distinción no encontrada");
    return item;
  }
};

export const crearDistincion = async (payload: DistincionPayload): Promise<Distincion> => {
  try {
    return await http<Distincion>("/distinciones/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("Error creating distincion, saving locally:", error);
    const data = getLocalStorageData();
    const proyecto = payload.proyecto_investigacion_id
      ? MOCK_PROYECTOS.find(p => p.id === payload.proyecto_investigacion_id)
      : undefined;
    const newItem: Distincion = {
      id: generateLocalId(),
      fecha: payload.fecha,
      descripcion: payload.descripcion,
      proyecto_investigacion_id: payload.proyecto_investigacion_id,
      proyecto: proyecto ? { id: proyecto.id, codigo: proyecto.codigo, nombre: proyecto.nombre } : undefined,
    };
    data.push(newItem);
    saveToLocalStorage(data);
    return newItem;
  }
};

export const actualizarDistincion = async (
  id: number,
  payload: Partial<DistincionPayload>
): Promise<Distincion> => {
  try {
    return await http<Distincion>(`/distinciones/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("Error updating distincion, saving locally:", error);
    const data = getLocalStorageData();
    const index = data.findIndex(d => d.id === id);
    if (index === -1) throw new Error("Distinción no encontrada");

    const updated: Distincion = {
      ...data[index],
      ...payload,
      proyecto: payload.proyecto_investigacion_id
        ? (MOCK_PROYECTOS.find(p => p.id === payload.proyecto_investigacion_id)
          ? { id: payload.proyecto_investigacion_id, codigo: MOCK_PROYECTOS.find(p => p.id === payload.proyecto_investigacion_id)!.codigo, nombre: MOCK_PROYECTOS.find(p => p.id === payload.proyecto_investigacion_id)!.nombre }
          : data[index].proyecto)
        : undefined,
    };
    data[index] = updated;
    saveToLocalStorage(data);
    return updated;
  }
};

export const eliminarDistincion = async (id: number): Promise<{ message: string }> => {
  try {
    return await http<{ message: string }>(`/distinciones/${id}`, { method: "DELETE" });
  } catch (error) {
    console.warn("Error deleting distincion, deleting locally:", error);
    const data = getLocalStorageData();
    const filtered = data.filter(d => d.id !== id);
    saveToLocalStorage(filtered);
    return { message: "Eliminado correctamente (local)" };
  }
};
