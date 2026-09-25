import { http } from "@/lib/http";
import { isMockMode } from "./tiposContratoService";

/** Forzar modo mock para adoptantes (poner false cuando el backend esté listo). */
const useMock = () => isMockMode();

// ─── Tipos ───────────────────────────────────────────────────
// El backend solo tiene: id (number) y nombre (string)

export interface Adoptante {
    id: number;
    nombre: string;
}

export type AdoptantePayload = Omit<Adoptante, "id">;

// ─── Mock helpers ────────────────────────────────────────────

let mockItems: Adoptante[] | null = null;

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

function readMock(): Adoptante[] {
    return mockItems ? [...mockItems] : [];
}

function writeMock(items: Adoptante[]) {
    mockItems = [...items];
}

let _mockIdCounter = 100;

function ensureSeed() {
    if (mockItems !== null) {
        const current = readMock();
        _mockIdCounter = Math.max(100, ...current.map((item) => item.id));
        return;
    }
    const seed: Adoptante[] = [
        { id: 1, nombre: "Empresa Tech SA" },
        { id: 2, nombre: "Municipalidad de Resistencia" },
        { id: 3, nombre: "Fundación Educativa del Norte" },
    ];
    _mockIdCounter = 100;
    writeMock(seed);
}

// ─── CRUD ────────────────────────────────────────────────────

/** Listar todos los adoptantes. */
export async function getAdoptantes(): Promise<Adoptante[]> {
    if (useMock()) {
        ensureSeed();
        await delay();
        return readMock();
    }
    return http<Adoptante[]>("/adoptantes");
}

/** Obtener un adoptante por id. */
export async function getAdoptanteById(
    id: number
): Promise<Adoptante | null> {
    if (useMock()) {
        await delay();
        return readMock().find((a) => a.id === id) ?? null;
    }
    return http<Adoptante>(`/adoptantes/${id}`);
}

/** Crear un adoptante. */
export async function createAdoptante(
    data: AdoptantePayload
): Promise<Adoptante> {
    if (useMock()) {
        await delay();
        const item: Adoptante = { ...data, id: ++_mockIdCounter };
        const list = readMock();
        list.push(item);
        writeMock(list);
        return item;
    }
    return http<Adoptante>("/adoptantes", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/** Actualizar un adoptante existente. */
export async function updateAdoptante(
    id: number,
    data: Partial<AdoptantePayload>
): Promise<Adoptante> {
    if (useMock()) {
        await delay();
        const list = readMock();
        const idx = list.findIndex((a) => a.id === id);
        if (idx === -1) throw new Error("Adoptante no encontrado");
        list[idx] = { ...list[idx], ...data };
        writeMock(list);
        return list[idx];
    }
    return http<Adoptante>(`/adoptantes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

/** Eliminar logicamente un adoptante. */
export async function deleteAdoptante(id: number): Promise<void> {
    if (useMock()) {
        await delay();
        writeMock(readMock().filter((a) => a.id !== id));
        return;
    }
    await http(`/adoptantes/${id}`, { method: "DELETE" });
}
