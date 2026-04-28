import { http } from "@/lib/http";

export type ProyectosActivosFilter = "true" | "false" | "all";

export type InvestigadorProyecto = {
  fecha_inicio: string;
  fecha_fin?: string | null;
  id: number;
  nombre_apellido: string;
  es_coordinador?: boolean;
};

export type BecarioProyecto = {
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  id: number;
  nombre_apellido: string;
};

export type InvestigadorVinculacionPayload = {
  id_investigador: number;
  fecha_inicio: string;
  fecha_fin?: string | null;
  es_coordinador?: boolean;
};

export type HistorialProyectoItem = {
  id: number | string;
  campo?: string;
  fecha_cambio?: string | null;
  usuario_nombre?: string | null;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
  tipo?: string;
};

export type Proyecto = {
  id?: string;
  created_by?: number | null;
  created_by_nombre?: string | null;
  created_at?: string | null | undefined;
  updated_by?: number | null;
  updated_by_nombre?: string | null;
  updated_at?: string | null | undefined;
  deleted_by?: number | null;
  deleted_by_nombre?: string | null;
  deleted_at?: string | null | undefined;
  activo?: boolean;
  cerrado?: boolean;
  tipoProyectoId: number;
  tipoProyectoNombre?: string;
  codigoProyecto: string;
  nombreProyecto: string;
  fechaInicio: string;
  fechaFinalizacion?: string | null;
  fuenteFinanciamientoId?: number | null;
  fuenteFinanciamientoNombre?: string;
  descripcionProyecto?: string;
  dificultadesProyecto?: string;
  montoDestinado?: number;
  grupoUtnId?: number | null;
  grupoUtnNombre?: string;
  investigadores?: InvestigadorProyecto[];
  becarios?: BecarioProyecto[];
};

function mapProyecto(p: any): Proyecto {
  return {
    id: String(p.id),
    created_by: p.created_by ?? null,
    created_by_nombre: p.created_by_nombre ?? null,
    created_at: p.created_at ?? null,
    updated_by: p.updated_by ?? null,
    updated_by_nombre: p.updated_by_nombre ?? null,
    updated_at: p.updated_at ?? null,
    deleted_by: p.deleted_by ?? null,
    deleted_by_nombre: p.deleted_by_nombre ?? null,
    deleted_at: p.deleted_at ?? null,
    activo: p.activo,
    cerrado: Boolean(p.cerrado),
    codigoProyecto: String(p.codigo_proyecto),
    nombreProyecto: p.nombre_proyecto,
    descripcionProyecto: p.descripcion_proyecto || "",
    dificultadesProyecto: p.dificultades_proyecto || "",
    montoDestinado:
      p.monto_destinado !== null && p.monto_destinado !== undefined
        ? Number(p.monto_destinado)
        : undefined,
    fechaInicio: p.fecha_inicio,
    fechaFinalizacion: p.fecha_fin,
    tipoProyectoId: p.tipo_proyecto?.id ?? p.tipo_proyecto_id,
    tipoProyectoNombre: p.tipo_proyecto?.nombre || "N/A",
    fuenteFinanciamientoId:
      p.fuente_financiamiento?.id ?? p.fuente_financiamiento_id ?? null,
    fuenteFinanciamientoNombre: p.fuente_financiamiento?.nombre || "N/A",
    grupoUtnId: p.grupo_utn?.id ?? p.grupo_utn_id ?? null,
    grupoUtnNombre:
      p.grupo_utn?.nombre || p.grupo_utn?.nombre_sigla_grupo || undefined,
    investigadores: (p.investigadores || []).map((inv: any) => ({
      id: inv.id,
      nombre_apellido: inv.nombre_apellido,
      fecha_inicio: inv.fecha_inicio,
      fecha_fin: inv.fecha_fin,
      es_coordinador: Boolean(inv.es_coordinador),
    })),
    becarios: (p.becarios || []).map((bec: any) => ({
      id: bec.id,
      nombre_apellido: bec.nombre_apellido,
      fecha_inicio: bec.fecha_inicio,
      fecha_fin: bec.fecha_fin,
    })),
  };
}

export async function getProyectos(
  activos: ProyectosActivosFilter = "true"
): Promise<Proyecto[]> {
  const activosParam =
    activos === "all" || activos === "false" || activos === "true"
      ? activos
      : "true";

  const data = await http<any[]>(`/proyectos?activos=${activosParam}`);
  return data.map(mapProyecto);
}

export async function upsertProyectos(payload: any) {
  const body: Record<string, unknown> = {};

  if ("codigoProyecto" in payload) {
    body.codigo_proyecto = payload.codigoProyecto;
  }

  if ("nombreProyecto" in payload) {
    body.nombre_proyecto = payload.nombreProyecto;
  }

  if ("descripcionProyecto" in payload) {
    body.descripcion_proyecto = payload.descripcionProyecto;
  }

  if ("fechaInicio" in payload) {
    body.fecha_inicio = payload.fechaInicio;
  }

  if ("fechaFinalizacion" in payload) {
    body.fecha_fin = payload.fechaFinalizacion || null;
  }

  if ("dificultadesProyecto" in payload) {
    body.dificultades_proyecto = payload.dificultadesProyecto || null;
  }

  if ("montoDestinado" in payload) {
    body.monto_destinado =
      payload.montoDestinado !== undefined &&
      payload.montoDestinado !== null &&
      payload.montoDestinado !== ""
        ? Number(payload.montoDestinado)
        : null;
  }

  if ("tipoProyectoId" in payload) {
    body.tipo_proyecto_id = payload.tipoProyectoId;
  }

  if ("fuenteFinanciamientoId" in payload) {
    body.fuente_financiamiento_id = payload.fuenteFinanciamientoId ?? null;
  }

  if ("grupoUtnId" in payload) {
    body.grupo_utn_id = payload.grupoUtnId ?? null;
  }

  const url = payload.id ? `/proyectos/${payload.id}` : "/proyectos/";
  const method = payload.id ? "PUT" : "POST";

  return http(url, { method, body: JSON.stringify(body) });
}

export async function deleteProyectos(id: string) {
  return http<void>(`/proyectos/${id}`, { method: "DELETE" });
}

export async function getProyectoById(id: number): Promise<Proyecto> {
  const data = await http<any>(`/proyectos/${id}`);
  return mapProyecto(data);
}

export async function getHistorialProyectoById(
  id: number
): Promise<HistorialProyectoItem[]> {
  const data = await http<HistorialProyectoItem[] | { data?: HistorialProyectoItem[] }>(
    `/proyectos/${id}/historial`,
    {
      method: "GET",
    }
  );

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

export async function cerrarProyecto(id: string, fechaFin: string) {
  return http(`/proyectos/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      fecha_fin: fechaFin,
    }),
  });
}

export async function reabrirProyecto(id: string) {
  return http(`/proyectos/${id}/reabrir`, {
    method: "PUT",
  });
}

export function vincularInvestigadores(
  proyectoId: number,
  investigadores: InvestigadorVinculacionPayload[]
) {
  return http(`/proyectos/${proyectoId}/investigadores`, {
    method: "POST",
    body: JSON.stringify(
      investigadores.map((inv) => ({
        id_investigador: inv.id_investigador,
        fecha_inicio: inv.fecha_inicio,
        fecha_fin: inv.fecha_fin ?? null,
        es_coordinador: Boolean(inv.es_coordinador),
      }))
    ),
  });
}

export function vincularBecarios(
  proyectoId: number,
  becariosIds: number[],
  fechaInicio: string
) {
  return http(`/proyectos/${proyectoId}/becarios`, {
    method: "POST",
    body: JSON.stringify(
      becariosIds.map((id) => ({
        id_becario: id,
        fecha_inicio: fechaInicio,
      }))
    ),
  });
}

export function desvincularInvestigadores(
  proyectoId: number,
  fechaFin: string,
  investigadoresIds: number[]
) {
  return http(`/proyectos/${proyectoId}/investigadores`, {
    method: "PUT",
    body: JSON.stringify({
      investigadores_ids: investigadoresIds,
      fecha_fin: fechaFin,
    }),
  });
}

export function desvincularBecarios(
  proyectoId: number,
  fechaFin: string,
  becariosIds: number[]
) {
  return http(`/proyectos/${proyectoId}/becarios`, {
    method: "PUT",
    body: JSON.stringify({
      becarios_ids: becariosIds,
      fecha_fin: fechaFin,
    }),
  });
}
