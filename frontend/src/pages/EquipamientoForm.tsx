import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import DatePicker from "@/components/Calendar";
import Field from "@/components/Field";
import React, { useState, useEffect } from "react";
import {
  getEquipamientoById,
  createEquipamiento,
  updateEquipamiento,
} from "@/services/equipamientoServices";
import { useUctGuard } from "@/hooks/useUctGuard";

export default function EquipamientoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { uct, uctGuard } = useUctGuard();

  const isEdit = Boolean(id);

  const { data: initial, isLoading } = useQuery({
    queryKey: ["equipamiento", id],
    queryFn: () => (id ? getEquipamientoById(Number(id)) : null),
    enabled: isEdit,
  });

  const [data, setData] = useState({
    denominacion: "",
    descripcion_breve: "",
    monto_invertido: undefined as number | undefined,
    fecha_incorporacion: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initial) {
      const formattedDate = initial.fecha_incorporacion
        ? new Date(initial.fecha_incorporacion).toISOString().split("T")[0]
        : "";

      setData({
        denominacion: initial.denominacion ?? "",
        descripcion_breve: initial.descripcion_breve ?? "",
        monto_invertido: initial.monto_invertido ?? undefined,
        fecha_incorporacion: formattedDate,
      });
    }
  }, [initial]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.denominacion.trim()) {
      newErrors.denominacion = "La denominación es obligatoria";
    }

    if (!data.descripcion_breve.trim()) {
      newErrors.descripcion = "La descripción es obligatoria";
    }

    if (!data.fecha_incorporacion) {
      newErrors.fecha_incorporacion = "La fecha es obligatoria";
    }

    if (
      data.monto_invertido === undefined ||
      data.monto_invertido <= 0
    ) {
      newErrors.monto = "El monto debe ser mayor a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: any) =>
      isEdit
        ? updateEquipamiento(Number(id), payload)
        : createEquipamiento(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipamiento"] });
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uct) return;
    if (!validate()) return;

    await mutateAsync({
      grupo_utn_id: uct.id,
      denominacion: data.denominacion,
      descripcion_breve: data.descripcion_breve,
      fecha_incorporacion: data.fecha_incorporacion,
      monto_invertido: data.monto_invertido!,
    });

    if (isEdit) {
      navigate(`/equipamiento/${id}`, {
        state: {
          successMessage: "Equipamiento actualizado con éxito!",
        },
      });
    } else {
      navigate("/equipamiento", {
        state: {
          successMessage: "Equipamiento creado con éxito!",
        },
      });
    }
  };

  if (isLoading) return <p>Cargando…</p>;

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        {isEdit ? "Editar equipamiento" : "Nuevo equipamiento"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
      >
        <Field label="Denominación">
          <>
            <input
              className={inputClass("denominacion")}
              value={data.denominacion}
              onChange={(e) => {
                setData((d) => ({
                  ...d,
                  denominacion: e.target.value,
                }));
                if (e.target.value.trim()) clearError("denominacion");
              }}
            />
            {errors.denominacion && (
              <p className="text-red-500 text-sm mt-1">
                {errors.denominacion}
              </p>
            )}
          </>
        </Field>

        <Field label="Descripción breve">
          <>
            <input
              className={inputClass("descripcion")}
              value={data.descripcion_breve}
              onChange={(e) => {
                setData((d) => ({
                  ...d,
                  descripcion_breve: e.target.value,
                }));
                if (e.target.value.trim()) clearError("descripcion");
              }}
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm mt-1">
                {errors.descripcion}
              </p>
            )}
          </>
        </Field>

        <Field label="Monto invertido">
          <>
            <input
              type="number"
              step="0.01"
              min={0}
              className={inputClass("monto")}
              value={data.monto_invertido ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : undefined;

                setData((d) => ({
                  ...d,
                  monto_invertido: value,
                }));

                if (value && value > 0) clearError("monto");
              }}
            />
            {errors.monto && (
              <p className="text-red-500 text-sm mt-1">
                {errors.monto}
              </p>
            )}
          </>
        </Field>

        <Field label="Fecha de incorporación">
          <DatePicker
            value={
              data.fecha_incorporacion
                ? new Date(data.fecha_incorporacion)
                : null
            }
            onChange={(dt) => {
              setData((d) => ({
                ...d,
                fecha_incorporacion: dt
                  ? dt.toISOString().split("T")[0]
                  : "",
              }));

              if (dt) clearError("fecha_incorporacion");
            }}
            helperText={errors.fecha_incorporacion ?? "DD/MM/AAAA"}
            className={inputClass("fecha_incorporacion")}
          />
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

          <Button
            type="submit"
            size="sm"
            disabled={isPending}
          >
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