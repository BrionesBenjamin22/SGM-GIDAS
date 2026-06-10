import { http } from "@/lib/http";

export interface Autor {
  id: number;
  nombre_apellido: string;
}

export interface Documentacion {
  id: number;
  created_by: number | null;
  created_by_nombre?: string | null;
  created_at: string | null | undefined;
  updated_by?: number | null;
  updated_by_nombre?: string | null;
  updated_at?: string | null | undefined;
  deleted_by: number | null;
  deleted_by_nombre?: string | null;
  deleted_at: string | null | undefined;
  titulo: string;
  editorial: string;
  anio: number;
  fecha: string;
  grupo_id: number | null;
  autores: Autor[];
}

export type HistorialDocumentacionItem = {
  id: number | string;
  campo?: string;
  fecha_cambio?: string | null;
  usuario_nombre?: string | null;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
  tipo?: string;
};

export interface DocumentacionPayload {
  titulo: string;
  editorial: string;
  anio: number;
  fecha: string;
  grupo_id: number;
}

const normalizeAutor = (autor: any): Autor => ({
  id: autor.id,
  nombre_apellido: autor.nombre_apellido ?? "",
});

const normalizeDocumentacion = (item: any): Documentacion => ({
  id: item.id,
  created_by: item.created_by ?? null,
  created_by_nombre: item.created_by_nombre ?? null,
  created_at: item.created_at ?? null,
  updated_by: item.updated_by ?? null,
  updated_by_nombre: item.updated_by_nombre ?? null,
  updated_at: item.updated_at ?? null,
  deleted_by: item.deleted_by ?? null,
  deleted_by_nombre: item.deleted_by_nombre ?? null,
  deleted_at: item.deleted_at ?? null,
  titulo: item.titulo ?? "",
  editorial: item.editorial ?? "",
  anio: typeof item.anio === "number" ? item.anio : Number(item.anio ?? 0),
  fecha: item.fecha ?? "",
  grupo_id: item.grupo_id ?? null,
  autores: Array.isArray(item.autores) ? item.autores.map(normalizeAutor) : [],
});

export async function getDocumentacion(
  activos: "true" | "false" | "all" = "true"
): Promise<Documentacion[]> {
  const response = await http<any>(
    `/documentacion-bibliografica?activos=${activos}`
  );

  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];

  return items.map(normalizeDocumentacion);
}

export async function getDocumentacionById(id: number): Promise<Documentacion> {
  const response = await http<any>(`/documentacion-bibliografica/${id}`);
  return normalizeDocumentacion(response);
}

export async function getHistorialDocumentacionById(
  id: number
): Promise<HistorialDocumentacionItem[]> {
  const response = await http<any>(`/documentacion-bibliografica/${id}/historial`, {
    method: "GET",
  });

  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export async function createDocumentacion(
  payload: DocumentacionPayload
): Promise<Documentacion> {
  const response = await http<any>("/documentacion-bibliografica", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeDocumentacion(response);
}

export async function updateDocumentacion(
  id: number,
  payload: Partial<DocumentacionPayload>
): Promise<Documentacion> {
  const body: Record<string, unknown> = {};

  if ("titulo" in payload) body.titulo = payload.titulo;
  if ("editorial" in payload) body.editorial = payload.editorial;
  if ("anio" in payload) body.anio = payload.anio;
  if ("fecha" in payload) body.fecha = payload.fecha;
  if ("grupo_id" in payload) body.grupo_id = payload.grupo_id;

  const response = await http<any>(`/documentacion-bibliografica/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  return normalizeDocumentacion(response);
}

export async function deleteDocumentacion(
  id: number
): Promise<{ message: string }> {
  return http<{ message: string }>(`/documentacion-bibliografica/${id}`, {
    method: "DELETE",
  });
}

export async function addAutorToDocumento(docId: number, autorId: number) {
  return http(`/documentacion-bibliografica/${docId}/autores`, {
    method: "POST",
    body: JSON.stringify({ autor_id: autorId }),
  });
}

export async function removeAutorFromDocumento(docId: number, autorId: number) {
  return http(`/documentacion-bibliografica/${docId}/autores/${autorId}`, {
    method: "DELETE",
  });
}

export const removeAutorFromDocumentacion = async (
  docId: number,
  autorId: number
) => {
  return http(`/documentacion-bibliografica/${docId}/autores/${autorId}`, {
    method: "DELETE",
  });
};
