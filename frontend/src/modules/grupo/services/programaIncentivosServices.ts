import { http } from "@/lib/http";

export interface ProgramaIncentivos {
  id: number;
  nombre: string;
}

export function getProgramasIncentivos() {
  return http<ProgramaIncentivos[]>("/programas-incentivos/");
}
