import { http } from "@/lib/http";

export interface CategoriaUtn {
  id: number;
  nombre: string;
}

export function getCategoriasUtn() {
  return http<CategoriaUtn[]>("/categoria-utn/");
}
