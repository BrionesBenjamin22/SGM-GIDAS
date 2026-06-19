import { http } from "@/lib/http";

export interface Beca {
    id: number;
    nombre_beca: string;
    descripcion?: string;

    // Auditoría
    created_at?: string;
    creator_name?: string;
    deleted_at?: string;
    deleter_name?: string;
    activo?: boolean;
}

export interface BecaVinculacionPayload {
    id_becario: number;
    fecha_inicio: string; // YYYY-MM-DD
    fecha_fin?: string;   // YYYY-MM-DD
    monto_percibido?: number;
}

export function getBecas() {
    return http<Beca[]>("/becas/", {
        method: "GET",
    });
}

export function getBecaById(id: number) {
    return http<Beca>(`/becas/${id}`, {
        method: "GET",
    });
}

export function vincularBecarioABeca(beca_id: number, payload: BecaVinculacionPayload) {
    return http(`/becas/${beca_id}/vincular-becario`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function desvincularBecarioDeBeca(beca_id: number, becario_id: number) {
    return http(`/becas/${beca_id}/becarios/${becario_id}`, {
        method: "DELETE",
    });
}