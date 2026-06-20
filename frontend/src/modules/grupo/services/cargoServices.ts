// src/services/cargoServices.ts
import { http } from "@/lib/http";

export type Cargo = {
  id: number;
  nombre: string;
};

// ------------------------------
export function getCargos() {
  return http<Cargo[]>("/cargos/", {
    method: "GET",
  });
}