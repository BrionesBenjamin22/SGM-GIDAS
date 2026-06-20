import { http } from "@/lib/http";

export interface ActividadDocencia {
  created_by: number | null;
  created_at: string | null | undefined;
  updated_by?: number | null;
  updated_at?: string | null | undefined;
  deleted_by: number | null;
  deleted_at: string | null | undefined;
  updated_by_nombre?: string | null;
  rol_actividad_id: number | null;
  grado_academico_id: number | null;
  id: number;
  curso: string;
  institucion: string;
  fecha_inicio: string;
  fecha_fin: string;
  grado_academico: string;
  grado_academico_actual?: { id: number; nombre: string } | null;
  historial_grados?: Array<{
    id: number | string;
    grado_academico?: string;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    activo?: boolean;
  }>;
  rol_actividad: string;
  investigador_id: number;
  investigador?: string | { id: number; nombre_apellido: string };
}

export interface HistorialActividadDocenciaItem {
  id: number | string;
  campo?: string;
  fecha_cambio?: string | null;
  usuario_nombre?: string | null;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
  tipo?: string;
}

export interface ActividadDocenciaPayload {
  curso: string;
  institucion: string;
  fecha_inicio: string;
  fecha_fin: string;
  grado_academico: string;
  rol_actividad: string;
  investigador_id: number;
}

export const getActividadesDocencia = async (
  investigadorId?: number,
  activo: "true" | "false" | "all" = "true"
): Promise<ActividadDocencia[]> => {
  const params = new URLSearchParams();

  if (investigadorId) {
    params.append("investigador_id", String(investigadorId));
  }

  params.append("activos", activo);

  const query = params.toString();

  return http<ActividadDocencia[]>(
    `/actividades-docencia${query ? `?${query}` : ""}`,
    {
      method: "GET",
    }
  );
};

export const getActividadDocenciaById = async (
  id: number
): Promise<ActividadDocencia> => {
  return http<ActividadDocencia>(`/actividades-docencia/${id}`, {
    method: "GET",
  });
};

export const crearActividadDocencia = async (
  payload: ActividadDocenciaPayload
): Promise<ActividadDocencia> => {
  return http<ActividadDocencia>(`/actividades-docencia/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const actualizarActividadDocencia = async (
  id: number,
  payload: Partial<ActividadDocenciaPayload>
): Promise<ActividadDocencia> => {
  return http<ActividadDocencia>(`/actividades-docencia/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const eliminarActividadDocencia = async (
  id: number
): Promise<{ message: string }> => {
  return http<{ message: string }>(`/actividades-docencia/${id}`, {
    method: "DELETE",
  });
};

export const getHistorialActividadDocenciaById = async (
  id: number
): Promise<HistorialActividadDocenciaItem[]> => {
  return http<HistorialActividadDocenciaItem[]>(
    `/actividades-docencia/${id}/historial`,
    {
      method: "GET",
    }
  );
};
