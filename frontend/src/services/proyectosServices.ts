import { http } from "@/lib/http";

export type ProyectosActivosFilter = "true" | "false" | "all";

export type InvestigadorProyecto = {
  fecha_inicio: any;
  fecha_fin?: any;
  id: number;
  nombre_apellido: string;
  es_coordinador?: boolean;
};

export type BecarioProyecto = {
  fecha_inicio?: any;
  fecha_fin?: any;
  id: number;
  nombre_apellido: string;
};

export type InvestigadorVinculacionPayload = {
  id_investigador: number;
  fecha_inicio: string;
  fecha_fin?: string | null;
  es_coordinador?: boolean;
};

export type Proyecto = {
  id?: string;

  created_by?: number | null;
  created_by_nombre?: string | null;
  created_at?: string | null | undefined;
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
  fechaFinalizacion?: string;

  fuenteFinanciamientoId?: number;
  fuenteFinanciamientoNombre?: string;

  descripcionProyecto?: string;
  dificultadesProyecto?: string;
  montoDestinado?: number;

  grupoUtnId?: number;
  grupoUtnNombre?: string;

  planificacionId?: number;
  planificacionDescripcion?: string;

  investigadores?: InvestigadorProyecto[];
  becarios?: BecarioProyecto[];
};

const BASE = import.meta.env.VITE_API_URL;

export async function getProyectos(
  activos: ProyectosActivosFilter = "true"
): Promise<Proyecto[]> {
  if (!BASE) return [];

  const activosParam: ProyectosActivosFilter =
    activos === "all" || activos === "false" || activos === "true"
      ? activos
      : "true";

  const data = await http<any[]>(`/proyectos?activos=${activosParam}`);

  return data.map((p: any) => ({
    id: String(p.id),

    created_by: p.created_by ?? null,
    created_by_nombre: p.created_by_nombre ?? null,
    created_at: p.created_at ?? null,
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

    tipoProyectoId: p.tipo_proyecto?.id,
    tipoProyectoNombre: p.tipo_proyecto?.nombre || "N/A",

    fuenteFinanciamientoId: p.fuente_financiamiento?.id,
    fuenteFinanciamientoNombre: p.fuente_financiamiento?.nombre || "N/A",

    grupoUtnId: p.grupo_utn?.id,
    grupoUtnNombre:
      p.grupo_utn?.nombre || p.grupo_utn?.nombre_sigla_grupo,

    planificacionId: p.planificacion?.id,
    planificacionDescripcion: p.planificacion?.descripcion,

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
  }));
}

export async function upsertProyectos(payload: any) {
  if (!BASE) throw new Error("Sin Backend");

  const body = {
    codigo_proyecto: payload.codigoProyecto,
    nombre_proyecto: payload.nombreProyecto,
    descripcion_proyecto: payload.descripcionProyecto,
    fecha_inicio: payload.fechaInicio,
    fecha_fin: payload.fechaFinalizacion || null,

    dificultades_proyecto: payload.dificultadesProyecto || null,
    monto_destinado:
      payload.montoDestinado !== undefined &&
      payload.montoDestinado !== null &&
      payload.montoDestinado !== ""
        ? Number(payload.montoDestinado)
        : null,

    tipo_proyecto_id: payload.tipoProyectoId,
    fuente_financiamiento_id: payload.fuenteFinanciamientoId ?? null,
    grupo_utn_id: payload.grupoUtnId ?? null,
    planificacion_id: payload.planificacionId ?? null,
  };

  const url = payload.id ? `/proyectos/${payload.id}` : "/proyectos/";
  const method = payload.id ? "PUT" : "POST";

  return http(url, { method, body: JSON.stringify(body) });
}

export async function deleteProyectos(id: string) {
  return http<void>(`/proyectos/${id}`, { method: "DELETE" });
}

export async function getProyectoById(id: number): Promise<Proyecto> {
  const data = await http<any>(`/proyectos/${id}`);

  return {
    id: String(data.id),

    created_by: data.created_by ?? null,
    created_by_nombre: data.created_by_nombre ?? null,
    created_at: data.created_at ?? null,
    deleted_by: data.deleted_by ?? null,
    deleted_by_nombre: data.deleted_by_nombre ?? null,
    deleted_at: data.deleted_at ?? null,
    activo: data.activo,
    cerrado: Boolean(data.cerrado),

    codigoProyecto: String(data.codigo_proyecto),
    nombreProyecto: data.nombre_proyecto,
    descripcionProyecto: data.descripcion_proyecto || "",
    dificultadesProyecto: data.dificultades_proyecto || "",
    montoDestinado:
      data.monto_destinado !== null && data.monto_destinado !== undefined
        ? Number(data.monto_destinado)
        : undefined,

    fechaInicio: data.fecha_inicio,
    fechaFinalizacion: data.fecha_fin,

    tipoProyectoId: data.tipo_proyecto?.id,
    tipoProyectoNombre: data.tipo_proyecto?.nombre,

    grupoUtnId: data.grupo_utn?.id,
    grupoUtnNombre:
      data.grupo_utn?.nombre || data.grupo_utn?.nombre_sigla_grupo,

    fuenteFinanciamientoId: data.fuente_financiamiento?.id,
    fuenteFinanciamientoNombre: data.fuente_financiamiento?.nombre,

    planificacionId: data.planificacion?.id,
    planificacionDescripcion: data.planificacion?.descripcion,

    investigadores: (data.investigadores || []).map((inv: any) => ({
      id: inv.id,
      nombre_apellido: inv.nombre_apellido,
      fecha_inicio: inv.fecha_inicio,
      fecha_fin: inv.fecha_fin,
      es_coordinador: Boolean(inv.es_coordinador),
    })),

    becarios: (data.becarios || []).map((bec: any) => ({
      id: bec.id,
      nombre_apellido: bec.nombre_apellido,
      fecha_inicio: bec.fecha_inicio,
      fecha_fin: bec.fecha_fin,
    })),
  };
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
