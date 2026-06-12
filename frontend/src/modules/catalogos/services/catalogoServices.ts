import { http } from "@/lib/http";

export interface CatalogItem {
    id: number;
    nombre: string;
    nombre_beca?: string;
    descripcion?: string;

    // Auditoría
    created_at?: string;
    creator_name?: string;
    deleted_at?: string;
    deleted_by_nombre?: string | null;
    deleter_name?: string;
    activo?: boolean;

    [key: string]: unknown;
}

export interface CatalogHistoryItem {
    id: number | string;
    entidad?: string;
    registro_id?: number;
    campo?: string;
    valor_anterior?: unknown;
    valor_nuevo?: unknown;
    fecha_cambio?: string;
    usuario_nombre?: string | null;
}

function withActivosAll(endpoint: string) {
    const separator = endpoint.includes("?") ? "&" : "?";
    return `${endpoint}${separator}activos=all`;
}

function withId(endpoint: string, id: number) {
    return `${endpoint.replace(/\/?$/, "/")}${id}`;
}

export async function getCatalogItems(endpoint: string): Promise<CatalogItem[]> {
    const data = await http<CatalogItem[] | CatalogItem | null>(
        withActivosAll(endpoint)
    );
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
}

export async function getCatalogHistory(
    endpoint: string,
    id: number
): Promise<CatalogHistoryItem[]> {
    return http<CatalogHistoryItem[]>(`${withId(endpoint, id)}/historial`);
}

export async function createCatalogItem(
    endpoint: string,
    body: Record<string, unknown>
): Promise<CatalogItem> {
    return http<CatalogItem>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function updateCatalogItem(
    endpoint: string,
    id: number,
    body: Record<string, unknown>
): Promise<CatalogItem> {
    return http<CatalogItem>(withId(endpoint, id), {
        method: "PUT",
        body: JSON.stringify(body),
    });
}

export async function deleteCatalogItem(
    endpoint: string,
    id: number
): Promise<void> {
    await http(withId(endpoint, id), { method: "DELETE" });
}
