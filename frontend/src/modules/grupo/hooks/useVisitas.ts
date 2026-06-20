import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getVisitantes,
  getVisitanteById,
  crearVisitante,
  actualizarVisitante,
  eliminarVisitante,
  type Visitante,
  type VisitantePayload,
} from "@/modules/grupo/services/visitantesServices";

export function useVisitantes(
  activos: "true" | "false" | "all" = "true"
) {
  const qc = useQueryClient();

  const visitantesQuery = useQuery({
    queryKey: ["visitantes", activos],
    queryFn: () => getVisitantes(activos),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: VisitantePayload) => crearVisitante(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitantes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<VisitantePayload>;
    }) => actualizarVisitante(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitantes"] });
      qc.invalidateQueries({ queryKey: ["visitante"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => eliminarVisitante(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitantes"] });
    },
  });

  return {
    list: visitantesQuery.data ?? [],
    isLoading: visitantesQuery.isLoading,
    isError: visitantesQuery.isError,

    create: createMutation.mutateAsync,
    creating: createMutation.isPending,

    update: updateMutation.mutateAsync,
    updating: updateMutation.isPending,

    remove: deleteMutation.mutateAsync,
    removing: deleteMutation.isPending,
  };
}

export function useVisitanteById(id?: number) {
  return useQuery<Visitante | null>({
    queryKey: ["visitante", id],
    queryFn: async () => {
      if (!id) return null;
      return getVisitanteById(id);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}