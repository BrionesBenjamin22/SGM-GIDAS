import { http } from "@/lib/http";

export interface ArticuloDivulgacion {
  id: number;
  created_by: number | null;
  created_by_nombre?: string | null;
  created_at: string | null | undefined;
  deleted_by: number | null;
  deleted_by_nombre?: string | null;
  deleted_at: string | null | undefined;
  titulo: string;
  descripcion: string;
  fecha_publicacion: string;
  grupo_utn_id: number;
  grupo_utn?: {
    id: number;
    nombre: string;
  };
}

export interface ArticuloPayload {
  titulo: string;
  descripcion: string;
  fecha_publicacion: string;
  grupo_utn_id: number;
}

type GetArticulosParams = {
  grupo_utn_id?: number;
  activos?: "true" | "false" | "all";
};

// 🔹 GET ALL
export const getArticulosDivulgacion = async (
  params?: GetArticulosParams
): Promise<ArticuloDivulgacion[]> => {
  const searchParams = new URLSearchParams();

  if (params?.grupo_utn_id) {
    searchParams.append("grupo_utn_id", String(params.grupo_utn_id));
  }

  if (params?.activos) {
    searchParams.append("activos", params.activos);
  }

  const query = searchParams.toString();
  const url = query
    ? `/articulos-divulgacion/?${query}`
    : "/articulos-divulgacion/";

  return http<ArticuloDivulgacion[]>(url, {
    method: "GET",
  });
};

// 🔹 GET BY ID
export const getArticuloById = async (
  id: number
): Promise<ArticuloDivulgacion> => {
  return http<ArticuloDivulgacion>(`/articulos-divulgacion/${id}`, {
    method: "GET",
  });
};

// 🔹 CREATE
export const createArticulo = async (
  payload: ArticuloPayload
): Promise<ArticuloDivulgacion> => {
  return http<ArticuloDivulgacion>("/articulos-divulgacion/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// 🔹 UPDATE
export const updateArticulo = async (
  id: number,
  payload: Partial<ArticuloPayload>
): Promise<ArticuloDivulgacion> => {
  return http<ArticuloDivulgacion>(`/articulos-divulgacion/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

// 🔹 DELETE
export const deleteArticulo = async (id: number) => {
  return http(`/articulos-divulgacion/${id}`, {
    method: "DELETE",
  });
};
