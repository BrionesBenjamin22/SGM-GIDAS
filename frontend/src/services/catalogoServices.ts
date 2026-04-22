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
    deleter_name?: string;
    activo?: boolean;

    [key: string]: unknown;
}

export async function getCatalogItems(endpoint: string): Promise<CatalogItem[]> {
    const data = await http<CatalogItem[] | CatalogItem | null>(endpoint);
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
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
    return http<CatalogItem>(`${endpoint}${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}

export async function deleteCatalogItem(
    endpoint: string,
    id: number
): Promise<void> {
    await http(`${endpoint}${id}`, { method: "DELETE" });
}