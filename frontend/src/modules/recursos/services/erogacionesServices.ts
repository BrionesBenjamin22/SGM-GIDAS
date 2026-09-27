import { http } from "@/lib/http";

const BASE = "/recursos/movimientos";

export type TipoMovimiento = "INGRESO" | "EGRESO";
export type MonedaMovimiento = "ARS" | "USD";

export type CategoriaErogacion = {
  id: number;
  codigo: "CORRIENTE" | "CAPITAL";
  nombre: string;
};

export type Erogacion = {
  id: number;
  numero_movimiento: number;
  tipo_movimiento: TipoMovimiento;
  monto: string;
  moneda: MonedaMovimiento;
  fecha: string;
  grupo_utn_id: number;
  fuente_financiamiento_id: number | null;
  categoria_erogacion_id: number | null;
  fuente: { id: number; nombre: string } | null;
  categoria_erogacion: CategoriaErogacion | null;
  grupo: { id: number; nombre: string } | null;
  activo: boolean;
  created_at: string | null;
  created_by: number | null;
  created_by_nombre?: string | null;
  updated_at: string | null;
  updated_by: number | null;
  updated_by_nombre?: string | null;
  deleted_at: string | null;
  deleted_by: number | null;
  deleted_by_nombre?: string | null;
};

export type Erogaciones = Erogacion;

export type HistorialErogacionItem = {
  id: number | string;
  campo?: string;
  fecha_cambio?: string | null;
  usuario_nombre?: string | null;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
  tipo?: string;
};

export type ResumenFinanciero = {
  moneda: "ARS";
  saldo_disponible: string;
  total_ingresos: string;
  total_egresos: string;
  cantidad_movimientos: number;
};

export type CreateErogacionPayload = {
  tipo_movimiento: TipoMovimiento;
  monto: string;
  fecha: string;
  grupo_utn_id: number;
  fuente_financiamiento_id?: number;
  categoria_erogacion_id?: number;
};

export type UpdateErogacionPayload = Partial<Pick<
  CreateErogacionPayload,
  "monto" | "fecha" | "fuente_financiamiento_id" | "categoria_erogacion_id"
>>;

export async function getErogaciones(activos: "true" | "false" | "all" = "true", grupoId?: number) {
  const params = new URLSearchParams({ activos });
  if (grupoId) params.set("grupo_utn_id", String(grupoId));
  return http<Erogacion[]>(`${BASE}/?${params}`);
}

export async function getErogacionById(id: number) {
  return http<Erogacion>(`${BASE}/${id}`);
}

export async function getHistorialErogacionById(id: number) {
  return http<HistorialErogacionItem[]>(`${BASE}/${id}/historial`);
}

export async function getCategoriasErogacion() {
  return http<CategoriaErogacion[]>(`${BASE}/categorias`);
}

export async function getResumenFinanciero(grupoId: number) {
  return http<ResumenFinanciero>(`${BASE}/grupos/${grupoId}/resumen`);
}

export async function createErogacion(payload: CreateErogacionPayload) {
  return http<Erogacion>(`${BASE}/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateErogacion(id: number, payload: UpdateErogacionPayload) {
  return http<Erogacion>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteErogaciones(id: number) {
  return http<{ message: string }>(`${BASE}/${id}`, { method: "DELETE" });
}
