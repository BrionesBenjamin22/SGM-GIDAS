import { http } from "@/lib/http";
import { isMockMode } from "./tiposContratoService";

/** Forzar modo mock para adoptantes (poner false cuando el backend esté listo). */
const FORCE_MOCK = false;
const useMock = () => FORCE_MOCK || isMockMode();

// ─── Tipos ───────────────────────────────────────────────────
// El backend solo tiene: id (number) y nombre (string)

export interface Adoptante {
    id: number;
    nombre: string;
}

export type AdoptantePayload = Omit<Adoptante, "id">;

// ─── Mock helpers ────────────────────────────────────────────

const MOCK_KEY = "gidas_adoptantes_mock";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

function readMock(): Adoptante[] {
    const raw = localStorage.getItem(MOCK_KEY);
    return raw ? JSON.parse(raw) : [];
}

function writeMock(items: Adoptante[]) {
    localStorage.setItem(MOCK_KEY, JSON.stringify(items));
}

let _mockIdCounter = 100;

function ensureSeed() {
    if (localStorage.getItem(MOCK_KEY) !== null) return;
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

/** Eliminar un adoptante (solo mock — backend no tiene DELETE). */
export async function deleteAdoptante(id: number): Promise<void> {
    if (useMock()) {
        await delay();
        writeMock(readMock().filter((a) => a.id !== id));
        return;
    }
    // Backend no tiene endpoint DELETE para adoptantes.
    // Ver backend_gaps.md
    console.warn("DELETE /adoptantes/:id no existe en el backend aún");
}
