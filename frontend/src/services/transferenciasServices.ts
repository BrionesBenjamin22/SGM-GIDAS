import { http } from "@/lib/http";
import { isMockMode } from "./tiposContratoService";
import type { Adoptante } from "./adoptantesServices";

/** Forzar modo mock para transferencias (poner false cuando el backend esté listo). */
const FORCE_MOCK = false;
const useMock = () => FORCE_MOCK || isMockMode();

// ─── Tipos ───────────────────────────────────────────────────

/** Lo que devuelve el backend en GET /transferencias */
interface TransferenciaBackend {
  id: number;
  demandante: string;
  descripcion_actividad: string;
  monto: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  tipo_contrato: string | null;
  grupo: string | null;
  adoptantes?: Adoptante[];
  numero_transferencia: number;
  denominacion: string;

  activo?: boolean;
  created_at?: string | null;
  deleted_at?: string | null;
  created_by?: number | string | null;
  created_by_nombre?: string | null;
  deleted_by?: number | string | null;
  deleted_by_nombre?: string | null;
}

/** Interfaz unificada del frontend. */
export interface Transferencia {
  id: number;
  demandante: string;
  descripcionActividad: string;
  monto: number | null;
  fechaInicio: string;
  fechaFin?: string;
  tipoContrato: string | null;
  tipoContratoId?: number;
  grupo: string | null;
  grupoUtnId?: number;
  adoptantes: Adoptante[];
  denominacion: string;
  numeroTransferencia: number;

  activo: boolean;
  created_at?: string | null;
  created_by_nombre?: string | null;
  deletedAt?: string | null;
  created_by?: number | string | null;
  deleted_by?: number | string | null;
  deleted_by_nombre?: string | null;
}

/** Payload para crear/editar en el frontend. */
export interface TransferenciaPayload {
  demandante: string;
  descripcionActividad: string;
  monto: number | null;
  fechaInicio: string;
  fechaFin?: string;
  tipoContratoId: number;
  grupoUtnId: number;
  adoptantesIds?: number[];
  denominacion: string;
  numeroTransferencia: number;
}

// ─── Mappers ─────────────────────────────────────────────────

function fromBackend(raw: TransferenciaBackend): Transferencia {
  return {
    id: raw.id,
    demandante: raw.demandante,
    descripcionActividad: raw.descripcion_actividad,
    monto: raw.monto,
    fechaInicio: raw.fecha_inicio,
    fechaFin: raw.fecha_fin ?? undefined,
    tipoContrato: raw.tipo_contrato,
    grupo: raw.grupo,
    adoptantes: raw.adoptantes ?? [],
    denominacion: raw.denominacion || "",
    numeroTransferencia: raw.numero_transferencia || 0,

    activo: raw.activo ?? raw.deleted_at == null,
    created_at: raw.created_at ?? null,
    created_by_nombre: raw.created_by_nombre ?? null,
    deletedAt: raw.deleted_at ?? null,
    created_by: raw.created_by ?? null,
    deleted_by: raw.deleted_by ?? null,
    deleted_by_nombre: raw.deleted_by_nombre ?? null,
  };
}

function toBackend(data: TransferenciaPayload): Record<string, unknown> {
  return {
    demandante: data.demandante,
    descripcion_actividad: data.descripcionActividad,
    monto: data.monto,
    fecha_inicio: data.fechaInicio,
    fecha_fin: data.fechaFin || null,
    tipo_contrato_id: data.tipoContratoId,
    grupo_utn_id: data.grupoUtnId,
    denominacion: data.denominacion,
    numero_transferencia: data.numeroTransferencia,
  };
}

// ─── Mock helpers ────────────────────────────────────────────

const MOCK_KEY = "gidas_transferencias_mock";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

function readMock(): Transferencia[] {
  const raw = localStorage.getItem(MOCK_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeMock(items: Transferencia[]) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(items));
}

let _mockIdCounter = 100;

function ensureSeed() {
  if (localStorage.getItem(MOCK_KEY) !== null) return;

  const now = new Date().toISOString();

  const seed: Transferencia[] = [
    {
      id: 1,
      denominacion: "Desarrollo de software de gestión para PyMEs",
      descripcionActividad:
        "Transferencia de sistema de gestión desarrollado por el grupo de investigación para su adopción en pequeñas y medianas empresas de la región.",
      demandante: "Cámara de Comercio Local",
      tipoContrato: "Transferencia de Tecnología",
      tipoContratoId: 1,
      grupo: "GIDAS",
      grupoUtnId: 1,
      monto: 150000,
      fechaInicio: "2024-03-01",
      fechaFin: "2024-12-31",
      numeroTransferencia: 2024001,
      adoptantes: [{ id: 1, nombre: "Empresa Tech SA" }],
      activo: true,
      created_at: now,
      deletedAt: null,
      created_by: 1,
      deleted_by: null,
    },
    {
      id: 2,
      denominacion: "Capacitación en Machine Learning aplicado",
      descripcionActividad:
        "Curso intensivo de 40 horas sobre técnicas de ML aplicadas al análisis de datos públicos municipales.",
      demandante: "Secretaría de Modernización",
      tipoContrato: "Transferencia de conocimientos",
      tipoContratoId: 3,
      grupo: "GIDAS",
      grupoUtnId: 1,
      monto: 80000,
      numeroTransferencia: 2024002,
      fechaInicio: "2024-06-15",
      adoptantes: [{ id: 2, nombre: "Municipalidad de Resistencia" }],
      activo: true,
      created_at: now,
      deletedAt: null,
      created_by: 1,
      deleted_by: null,
    },
    {
      id: 3,
      denominacion: "Ensayos de resistencia de materiales",
      descripcionActividad:
        "Realización de ensayos normalizados de compresión y tracción sobre probetas de hormigón para obra en curso.",
      demandante: "Constructora Norte SRL",
      tipoContrato:
        "Servicios Técnicos / de apoyo / supervisión y/o Ensayos de Laboratorio",
      tipoContratoId: 5,
      grupo: "GIDAS",
      grupoUtnId: 1,
      monto: null,
      fechaInicio: "2024-01-10",
      fechaFin: "2024-04-30",
      numeroTransferencia: 2024005,
      adoptantes: [{ id: 3, nombre: "Fundación Educativa del Norte" }],
      activo: false,
      created_at: now,
      deletedAt: "2026-03-27T12:00:00",
      created_by: 1,
      deleted_by: 1,
    },
  ];

  _mockIdCounter = 100;
  writeMock(seed);
}

// ─── CRUD Transferencias ─────────────────────────────────────

export async function getTransferencias(
  activos: "true" | "false" | "all" = "true"
): Promise<Transferencia[]> {
  if (useMock()) {
    ensureSeed();
    await delay();

    const items = readMock();

    if (activos === "true") return items.filter((t) => t.activo);
    if (activos === "false") return items.filter((t) => !t.activo);
    return items;
  }

  const raw = await http<TransferenciaBackend[]>(
    `/transferencias/?activos=${activos}`
  );

  return raw.map(fromBackend);
}

export async function getTransferenciaById(
  id: number
): Promise<Transferencia | null> {
  if (useMock()) {
    await delay();
    return readMock().find((t) => t.id === id) ?? null;
  }

  const raw = await http<TransferenciaBackend | null>(`/transferencias/${id}`);
  return raw ? fromBackend(raw) : null;
}

export async function createTransferencia(
  data: TransferenciaPayload
): Promise<Transferencia> {
  if (useMock()) {
    await delay();

    const item: Transferencia = {
      id: ++_mockIdCounter,
      demandante: data.demandante,
      descripcionActividad: data.descripcionActividad,
      monto: data.monto,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      tipoContrato: null,
      tipoContratoId: data.tipoContratoId,
      grupo: null,
      grupoUtnId: data.grupoUtnId,
      adoptantes: [],
      denominacion: data.denominacion || "Sin Denominación",
      numeroTransferencia: data.numeroTransferencia,
      activo: true,
      created_at: new Date().toISOString(),
      deletedAt: null,
      created_by: 1,
      deleted_by: null,
    };

    const list = readMock();
    list.push(item);
    writeMock(list);
    return item;
  }

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
  if (useMock()) {
    await delay();
    const list = readMock();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Transferencia no encontrada");

    list[idx] = {
      ...list[idx],
      demandante: data.demandante ?? list[idx].demandante,
      descripcionActividad:
        data.descripcionActividad ?? list[idx].descripcionActividad,
      monto: data.monto ?? list[idx].monto,
      fechaInicio: data.fechaInicio ?? list[idx].fechaInicio,
      fechaFin: data.fechaFin ?? list[idx].fechaFin,
      tipoContratoId: data.tipoContratoId ?? list[idx].tipoContratoId,
      grupoUtnId: data.grupoUtnId ?? list[idx].grupoUtnId,
      denominacion: data.denominacion ?? list[idx].denominacion,
      numeroTransferencia:
        data.numeroTransferencia ?? list[idx].numeroTransferencia,
    };

    writeMock(list);
    return list[idx];
  }

  const backendPayload: Record<string, unknown> = {};

  if (data.demandante !== undefined) backendPayload.demandante = data.demandante;
  if (data.descripcionActividad !== undefined) {
    backendPayload.descripcion_actividad = data.descripcionActividad;
  }
  if (data.monto !== undefined) backendPayload.monto = data.monto;
  if (data.fechaInicio !== undefined) backendPayload.fecha_inicio = data.fechaInicio;
  if (data.fechaFin !== undefined) backendPayload.fecha_fin = data.fechaFin || null;
  if (data.tipoContratoId !== undefined) {
    backendPayload.tipo_contrato_id = data.tipoContratoId;
  }
  if (data.grupoUtnId !== undefined) {
    backendPayload.grupo_utn_id = data.grupoUtnId;
  }
  if (data.denominacion !== undefined) backendPayload.denominacion = data.denominacion;
  if (data.numeroTransferencia !== undefined) {
    backendPayload.numero_transferencia = data.numeroTransferencia;
  }

  const raw = await http<TransferenciaBackend>(`/transferencias/${id}`, {
    method: "PUT",
    body: JSON.stringify(backendPayload),
  });

  return fromBackend(raw);
}

export async function deleteTransferencia(id: number): Promise<void> {
  if (useMock()) {
    await delay();
    const list = readMock();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return;

    list[idx] = {
      ...list[idx],
      activo: false,
      deletedAt: new Date().toISOString(),
      deleted_by: 1,
    };

    writeMock(list);
    return;
  }

  await http(`/transferencias/${id}`, {
    method: "DELETE",
  });
}

export async function addAdoptantesToTransferencia(
  transferenciaId: number,
  adoptantesIds: number[]
): Promise<void> {
  if (useMock()) {
    await delay();
    return;
  }

  await http(`/transferencias/${transferenciaId}/adoptantes`, {
    method: "POST",
    body: JSON.stringify({ adoptantes_ids: adoptantesIds }),
  });
}

export async function removeAdoptantesFromTransferencia(
  transferenciaId: number,
  adoptantesIds: number[]
): Promise<void> {
  if (useMock()) {
    await delay();
    return;
  }

  await http(`/transferencias/${transferenciaId}/adoptantes`, {
    method: "DELETE",
    body: JSON.stringify({ adoptantes_ids: adoptantesIds }),
  });
}
