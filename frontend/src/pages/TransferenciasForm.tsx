import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import Button from "@/components/Button";
import Field from "@/components/Field";
import {
  createPlanificacion,
  getPlanificacionById,
  updatePlanificacion,
} from "@/services/planificacionGrupoServices";
import { useUctGuard } from "@/hooks/useUctGuard";

export default function PlanificacionGrupoForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { uct, uctGuard } = useUctGuard();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [data, setData] = useState({
    descripcion: "",
    anio: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: planificacion, isLoading } = useQuery({
    queryKey: ["planificaciones", id],
    queryFn: () => getPlanificacionById(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (planificacion) {
      setData({
        descripcion: planificacion.descripcion ?? "",
        anio: planificacion.anio?.toString() ?? "",
      });
    }
  }, [planificacion]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.descripcion.trim()) {
      newErrors.descripcion = "Debe ingresar descripción";
    }

    if (!data.anio || data.anio.length !== 4) {
      newErrors.anio = "El año debe tener 4 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: any) =>
      isEdit
        ? updatePlanificacion(Number(id), payload)
        : createPlanificacion(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planificaciones"] });
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uct) return;
    if (!validate()) return;

    await mutateAsync({
      descripcion: data.descripcion,
      anio: Number(data.anio),
      grupo_id: uct.id,
    });

    if (isEdit) {
      navigate(`/planificaciones/${id}`, {
        state: {
          successMessage: "Planificación actualizada con éxito!",
        },
      });
    } else {
      navigate("/planificaciones", {
        state: {
          successMessage: "Planificación creada con éxito!",
        },
      });
    }
  };

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  if (isEdit && isLoading) {
    return <p className="text-slate-500">Cargando planificación…</p>;
  }

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        {isEdit ? "Editar planificación" : "Nueva planificación"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
      >
        <Field label="Año">
          <>
            <input
              type="number"
              className={inputClass("anio")}
              value={data.anio}
              onChange={(e) => {
                if (e.target.value.length <= 4) {
                  setData({ ...data, anio: e.target.value });
                  clearError("anio");
                }
              }}
            />
            {errors.anio && (
              <p className="text-red-500 text-sm mt-1">
                {errors.anio}
              </p>
            )}
          </>
        </Field>

        <Field label="Descripción">
          <>
            <textarea
              rows={8}
              className={inputClass("descripcion")}
              value={data.descripcion}
              onChange={(e) => {
                setData({ ...data, descripcion: e.target.value });
                clearError("descripcion");
              }}
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm mt-1">
                {errors.descripcion}
              </p>
            )}
          </>
        </Field>

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>

          <Button type="submit" size="sm" disabled={isPending}>
            {isPending
              ? "Guardando…"
              : isEdit
                ? "Actualizar"
                : "Guardar"}
          </Button>
        </div>
      </form>
      {uctGuard}
    </section>
  );
}