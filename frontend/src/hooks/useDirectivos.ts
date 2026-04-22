// src/hooks/useDirectivos.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDirectivosActuales,
  createDirectivo,
  asignarDirectivo,
  updateDirectivo,
  finalizarDirectivo,
  type DirectivoActual,
} from "@/services/directivosServices";

export function useDirectivos(grupoId?: number) {
  return useQuery<DirectivoActual[]>({
    queryKey: ["directivos-actuales", grupoId],
    queryFn: () => getDirectivosActuales(grupoId as number),
    enabled: !!grupoId,
  });
}

export function useCrearYAsignarDirectivo(grupoId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      nombre_apellido: string;
      id_cargo: number;
      fecha_inicio: string;
    }) => {
      const directivo = await createDirectivo({
        nombre_apellido: payload.nombre_apellido,
      });

      await asignarDirectivo({
        id_directivo: directivo.id,
        id_grupo_utn: grupoId,
        id_cargo: payload.id_cargo,
        fecha_inicio: payload.fecha_inicio,
      });

      return directivo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directivos-actuales", grupoId] });
      queryClient.invalidateQueries({ queryKey: ["uct"] });
    },
  });
}

export function useActualizarDirectivo(grupoId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      nombre_apellido,
    }: {
      id: number;
      nombre_apellido: string;
    }) => updateDirectivo(id, { nombre_apellido }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directivos-actuales", grupoId] });
      queryClient.invalidateQueries({ queryKey: ["uct"] });
    },
  });
}

export function useFinalizarDirectivo(grupoId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id_directivo,
      fecha_fin,
    }: {
      id_directivo: number;
      fecha_fin: string;
    }) => finalizarDirectivo({ id_directivo, fecha_fin, id_grupo_utn: grupoId as number }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directivos-actuales", grupoId] });
      queryClient.invalidateQueries({ queryKey: ["uct"] });
    },
  });
}