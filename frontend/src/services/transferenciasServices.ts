import { http } from "@/lib/http";
import { isMockMode } from "./tiposContratoService";
import type { Adoptante } from "./adoptantesServices";

const FORCE_MOCK = false;
const useMock = () => FORCE_MOCK || isMockMode();

interface TransferenciaBackend {
  id: number;
  numero_transferencia: number;
  denominacion: string;
  demandante: string;
  descripcion_actividad: string;
  monto: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  tipo_contrato: string | null;
  tipo_contrato_id?: number | null;
  grupo: string | null;
  grupo_utn_id?: number | null;
  adoptantes?: Adoptante[];
  created_at?: string | null;
  created_by?: number | string | null;
  created_by_nombre?: string | null;
  updated_at?: string | null;
  updated_by?: number | string | null;
  updated_by_nombre?: string | null;
  deleted_at?: string | null;
  deleted_by?: number | string | null;
  deleted_by_nombre?: string | null;
}

export interface Transferencia {
  id: number;
  numeroTransferencia: number;
  denominacion: string;
  demandante: string;
  descripcionActividad: string;
  monto: number | null;
  fechaInicio: string;
  fechaFin?: string;
  tipoContrato: string | null;
  tipoContratoId?: number | null;
  grupo: string | null;
  grupoUtnId?: number | null;
  adoptantes: Adoptante[];
  activo: boolean;
  created_at?: string | null;
  created_by?: number | string | null;
  created_by_nombre?: string | null;
  updated_at?: string | null;
  updated_by?: number | string | null;
  updated_by_nombre?: string | null;
  deletedAt?: string | null;
  deleted_by?: number | string | null;
  deleted_by_nombre?: string | null;
}

export type HistorialTransferenciaItem = {
  id: number | string;
  campo?: string;
  fecha_cambio?: string | null;
  usuario_nombre?: string | null;
  valor_anterior?: unknown;
  valor_nuevo?: unknown;
  tipo?: string;
};

export interface TransferenciaPayload {
  numeroTransferencia: number;
  denominacion: string;
  demandante: string;
  descripcionActividad: string;
  monto: number;
  fechaInicio: string;
  fechaFin?: string;
  tipoContratoId: number;
  grupoUtnId: number;
  adoptantesIds?: number[];
}

function fromBackend(raw: TransferenciaBackend): Transferencia {
  return {
    id: raw.id,
    numeroTransferencia: raw.numero_transferencia ?? 0,
    denominacion: raw.denominacion ?? "",
    demandante: raw.demandante ?? "",
    descripcionActividad: raw.descripcion_actividad ?? "",
    monto:
      typeof raw.monto === "number"
        ? raw.monto
        : raw.monto === null
          ? null
          : Number(raw.monto ?? 0),
    fechaInicio: raw.fecha_inicio ?? "",
    fechaFin: raw.fecha_fin ?? undefined,
    tipoContrato: raw.tipo_contrato ?? null,
    tipoContratoId: raw.tipo_contrato_id ?? null,
    grupo: raw.grupo ?? null,
    grupoUtnId: raw.grupo_utn_id ?? null,
    adoptantes: Array.isArray(raw.adoptantes) ? raw.adoptantes : [],
    activo: raw.deleted_at == null,
    created_at: raw.created_at ?? null,
    created_by: raw.created_by ?? null,
    created_by_nombre: raw.created_by_nombre ?? null,
    updated_at: raw.updated_at ?? null,
    updated_by: raw.updated_by ?? null,
    updated_by_nombre: raw.updated_by_nombre ?? null,
    deletedAt: raw.deleted_at ?? null,
    deleted_by: raw.deleted_by ?? null,
    deleted_by_nombre: raw.deleted_by_nombre ?? null,
  };
}

function toBackend(data: Partial<TransferenciaPayload>): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if ("numeroTransferencia" in data) {
    body.numero_transferencia = data.numeroTransferencia;
  }
  if ("denominacion" in data) {
    body.denominacion = data.denominacion;
  }
  if ("demandante" in data) {
    body.demandante = data.demandante;
  }
  if ("descripcionActividad" in data) {
    body.descripcion_actividad = data.descripcionActividad;
  }
  if ("monto" in data) {
    body.monto = data.monto;
  }
  if ("fechaInicio" in data) {
    body.fecha_inicio = data.fechaInicio;
  }
  if ("fechaFin" in data) {
    body.fecha_fin = data.fechaFin || null;
  }
  if ("tipoContratoId" in data) {
    body.tipo_contrato_id = data.tipoContratoId;
  }
  if ("grupoUtnId" in data) {
    body.grupo_utn_id = data.grupoUtnId;
  }

  return body;
}

export async function getTransferencias(
  activos: "true" | "false" | "all" = "true"
): Promise<Transferencia[]> {
  if (useMock()) {
    return [];
  }

  const response = await http<any>(`/transferencias/?activos=${activos}`);
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];

  return items.map(fromBackend);
}

export async function getTransferenciaById(
  id: number
): Promise<Transferencia | null> {
  if (useMock()) {
    return null;
  }

  const raw = await http<TransferenciaBackend | null>(`/transferencias/${id}`);
  return raw ? fromBackend(raw) : null;
}

export async function getHistorialTransferenciaById(
  id: number
): Promise<HistorialTransferenciaItem[]> {
  const response = await http<any>(`/transferencias/${id}/historial`, {
    method: "GET",
  });

  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export async function createTransferencia(
  data: TransferenciaPayload
): Promise<Transferencia> {
  const raw = await http<TransferenciaBackend>("/transferencias/", {
    method: "POST",
    body: JSON.stringify(toBackend(data)),
  });

  const created = fromBackend(raw);

  if (data.adoptantesIds && data.adoptantesIds.length > 0) {
    await addAdoptantesToTransferencia(created.id, data.adoptantesIds);
  }

  return created;
}

export async function updateTransferencia(
  id: number,
  data: Partial<TransferenciaPayload>
): Promise<Transferencia> {
  const raw = await http<TransferenciaBackend>(`/transferencias/${id}`, {
    method: "PUT",
    body: JSON.stringify(toBackend(data)),
  });

  return fromBackend(raw);
}

export async function deleteTransferencia(id: number): Promise<void> {
  await http(`/transferencias/${id}`, {
    method: "DELETE",
  });
}

export async function addAdoptantesToTransferencia(
  transferenciaId: number,
  adoptantesIds: number[]
): Promise<void> {
  await http(`/transferencias/${transferenciaId}/adoptantes`, {
    method: "POST",
    body: JSON.stringify({ adoptantes_ids: adoptantesIds }),
  });
}

export async function removeAdoptantesFromTransferencia(
  transferenciaId: number,
  adoptantesIds: number[]
): Promise<void> {
  await http(`/transferencias/${transferenciaId}/adoptantes`, {
    method: "DELETE",
    body: JSON.stringify({ adoptantes_ids: adoptantesIds }),
  });
}
