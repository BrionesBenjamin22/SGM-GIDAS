import { http } from "@/lib/http";

export interface InvestigadorPayload {
  nombre_apellido: string;
  horas_semanales: number;
  created_by?: number | null;
  deleted_by?: number | null;
  created_at?: string | null | undefined;
  deleted_at?: string | null | undefined;
  grupo_utn_id: number;
  tipo_dedicacion_id: number;   // 🔥 CORREGIDO
  categoria_utn_id?: number;
  programa_incentivos_id?: number;
  activo: boolean;
}

export function crearInvestigador(payload: InvestigadorPayload) {
  return http("/investigadores/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function actualizarInvestigador(
  id: number,
  payload: any,
  rol: string
) {
  return http(`/personal/${rol}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}


export function getInvestigadorById(id: number) {
  return http(`/investigadores/${id}`, {
    method: "GET",
  });
}

export function getInvestigadores() {
  return http("/investigadores/", {
    method: "GET",
  });
}