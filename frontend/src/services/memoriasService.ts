import { http, httpDownload, HttpError } from "@/lib/http";

export type MemoriaActivosFilter = "true" | "false" | "all";
export type MemoriaEstado = "abierta" | "en revision" | "cerrada";

export type MemoriaVersion = {
  id: number;
  numero_version: number;
  fecha_apertura: string;
  fecha_cierre?: string | null;
  estado: MemoriaEstado;
  memoria_id: number;
  created_at?: string | null;
  created_by?: number | null;
  created_by_nombre?: string | null;
  updated_at?: string | null;
  updated_by?: number | null;
  updated_by_nombre?: string | null;
  deleted_at?: string | null;
  deleted_by?: number | null;
  deleted_by_nombre?: string | null;
  activo?: boolean;
};

export type Memoria = {
  id: number;
  periodo_inicio: string;
  periodo_fin: string;
  version_actual_id?: number | null;
  version_actual?: MemoriaVersion | null;
  versiones?: MemoriaVersion[];
  cantidad_versiones: number;
  cantidad_elementos?: number;
  created_at?: string | null;
  created_by?: number | null;
  created_by_nombre?: string | null;
  updated_at?: string | null;
  updated_by?: number | null;
  updated_by_nombre?: string | null;
  deleted_at?: string | null;
  deleted_by?: number | null;
  deleted_by_nombre?: string | null;
  activo?: boolean;
};

export type MemoriaPayload = {
  periodo_inicio: string;
  periodo_fin: string;
  fecha_apertura?: string;
};

export type CambioEstadoMemoriaPayload = {
  estado: MemoriaEstado;
  fecha_cierre?: string;
};

export type ReabrirMemoriaPayload = {
  fecha_apertura?: string;
};

type SnapshotPath =
  | "investigadores"
  | "becarios"
  | "personal"
  | "proyectos"
  | "actividades-docencia"
  | "participaciones-relevantes"
  | "documentacion-bibliografica"
  | "equipamiento"
  | "erogaciones"
  | "transferencias"
  | "trabajos-reunion-cientifica"
  | "trabajos-revistas"
  | "distinciones"
  | "registros-propiedad"
  | "articulos-divulgacion"
  | "visitas-academicas";

export async function getMemorias(
  activos: MemoriaActivosFilter = "true"
): Promise<Memoria[]> {
  return http<Memoria[]>(`/memorias?activos=${activos}`);
}

export async function getMemoriaById(id: number): Promise<Memoria | null> {
  return http<Memoria | null>(`/memorias/${id}`);
}

export async function createMemoria(payload: MemoriaPayload): Promise<Memoria> {
  return http<Memoria>("/memorias", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cambiarEstadoMemoria(
  id: number,
  payload: CambioEstadoMemoriaPayload
): Promise<Memoria> {
  return http<Memoria>(`/memorias/${id}/estado`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function reabrirMemoria(
  id: number,
  payload: ReabrirMemoriaPayload = {}
): Promise<Memoria> {
  return http<Memoria>(`/memorias/${id}/reabrir`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteMemoria(id: number): Promise<{ message: string }> {
  return http<{ message: string }>(`/memorias/${id}`, {
    method: "DELETE",
  });
}

function getFilenameFromDisposition(contentDisposition: string | null): string {
  if (!contentDisposition) return "memoria.xlsx";

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/["']/g, ""));
  }

  const quotedMatch = contentDisposition.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const plainMatch = contentDisposition.match(/filename\s*=\s*([^;]+)/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].replace(/["']/g, "").trim();
  }

  return "memoria.xlsx";
}

function extractHttpErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    const body = error.body as any;

    if (typeof body === "string" && body.trim()) {
      return body;
    }

    if (body?.error) return body.error;
    if (body?.message) return body.message;
    if (error.status === 401) return "No autorizado. Inicia sesion nuevamente.";

    return `Error al exportar el Excel. (${error.status})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Error al exportar el Excel.";
}

export async function exportarExcelMemoria(
  memoriaId: number,
  versionId: number
): Promise<{ filename: string; size: number }> {
  try {
    const response = await httpDownload(
      `/memorias/${memoriaId}/versiones/${versionId}/exportar-excel`,
      {
        method: "GET",
      }
    );

    const blob = await response.blob();

    if (!blob || blob.size === 0) {
      throw new Error("El archivo exportado esta vacio.");
    }

    const filename = getFilenameFromDisposition(
      response.headers.get("content-disposition")
    );

    const url = window.URL.createObjectURL(blob);

    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      window.URL.revokeObjectURL(url);
    }

    return {
      filename,
      size: blob.size,
    };
  } catch (error) {
    throw new Error(extractHttpErrorMessage(error));
  }
}

async function getSnapshot<T = any>(
  memoriaId: number,
  versionId: number,
  path: SnapshotPath
): Promise<T[]> {
  const response = await http<T[] | { data?: T[] }>(
    `/memorias/${memoriaId}/versiones/${versionId}/${path}`
  );

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

export const getInvestigadoresSnapshot = (memoriaId: number, versionId: number) =>
  getSnapshot(memoriaId, versionId, "investigadores");

export const getBecariosSnapshot = (memoriaId: number, versionId: number) =>
  getSnapshot(memoriaId, versionId, "becarios");

export const getPersonalSnapshot = (memoriaId: number, versionId: number) =>
  getSnapshot(memoriaId, versionId, "personal");

export const getProyectosSnapshot = (memoriaId: number, versionId: number) =>
  getSnapshot(memoriaId, versionId, "proyectos");

export const getActividadesDocenciaSnapshot = (
  memoriaId: number,
  versionId: number
) => getSnapshot(memoriaId, versionId, "actividades-docencia");

export const getParticipacionesRelevantesSnapshot = (
  memoriaId: number,
  versionId: number
) => getSnapshot(memoriaId, versionId, "participaciones-relevantes");

export const getDocumentacionBibliograficaSnapshot = (
  memoriaId: number,
  versionId: number
) => getSnapshot(memoriaId, versionId, "documentacion-bibliografica");

export const getEquipamientoSnapshot = (memoriaId: number, versionId: number) =>
  getSnapshot(memoriaId, versionId, "equipamiento");

export const getErogacionesSnapshot = (memoriaId: number, versionId: number) =>
  getSnapshot(memoriaId, versionId, "erogaciones");

export const getTransferenciasSnapshot = (memoriaId: number, versionId: number) =>
  getSnapshot(memoriaId, versionId, "transferencias");

export const getTrabajosReunionCientificaSnapshot = (
  memoriaId: number,
  versionId: number
) => getSnapshot(memoriaId, versionId, "trabajos-reunion-cientifica");

export const getTrabajosRevistasSnapshot = (memoriaId: number, versionId: number) =>
  getSnapshot(memoriaId, versionId, "trabajos-revistas");

export const getDistincionesSnapshot = (memoriaId: number, versionId: number) =>
  getSnapshot(memoriaId, versionId, "distinciones");

export const getRegistrosPropiedadSnapshot = (
  memoriaId: number,
  versionId: number
) => getSnapshot(memoriaId, versionId, "registros-propiedad");

export const getArticulosDivulgacionSnapshot = (
  memoriaId: number,
  versionId: number
) => getSnapshot(memoriaId, versionId, "articulos-divulgacion");

export const getVisitasAcademicasSnapshot = (
  memoriaId: number,
  versionId: number
) => getSnapshot(memoriaId, versionId, "visitas-academicas");
