import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  asignarDirectivo,
  createDirectivo,
  finalizarDirectivo,
  getDirectivosActuales,
  getHistorialDirectivos,
  updateDirectivo,
  type DirectivoActual,
  type DirectivoPeriodo,
} from "@/services/directivosServices";

export function useDirectivos(grupoId?: number) {
  return useQuery<DirectivoActual[]>({
    queryKey: ["directivos-actuales", grupoId],
    queryFn: () => getDirectivosActuales(grupoId as number),
    enabled: !!grupoId,
  });
}

export function useHistorialDirectivos(grupoId?: number, enabled = false) {
  return useQuery<DirectivoPeriodo[]>({
    queryKey: ["directivos-historial", grupoId],
    queryFn: () => getHistorialDirectivos(grupoId as number),
    enabled: !!grupoId && enabled,
  });
}

function invalidateDirectivos(
  queryClient: ReturnType<typeof useQueryClient>,
  grupoId?: number
) {
  queryClient.invalidateQueries({
    queryKey: ["directivos-actuales", grupoId],
  });
  queryClient.invalidateQueries({
    queryKey: ["directivos-historial", grupoId],
  });
  queryClient.invalidateQueries({ queryKey: ["uct"] });
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
    onSuccess: () => invalidateDirectivos(queryClient, grupoId),
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
    onSuccess: () => invalidateDirectivos(queryClient, grupoId),
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
    }) =>
      finalizarDirectivo({
        id_directivo,
        fecha_fin,
        id_grupo_utn: grupoId as number,
      }),
    onSuccess: () => invalidateDirectivos(queryClient, grupoId),
  });
}
