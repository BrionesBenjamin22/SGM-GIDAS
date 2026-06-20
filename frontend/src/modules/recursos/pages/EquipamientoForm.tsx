import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import DatePicker from "@/components/Calendar";
import Field from "@/components/Field";
import React, { useState, useEffect } from "react";
import SuccessToast from "@/components/SuccessToast";
import { HttpError } from "@/lib/http";
import {
  createEquipamiento,
  getEquipamientoById,
  updateEquipamiento,
} from "@/modules/recursos/services/equipamientoServices";
import { useUctGuard } from "@/modules/grupo/hooks/useUctGuard";

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
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!initial) return;

    const formattedDate = initial.fecha_incorporacion
      ? new Date(`${initial.fecha_incorporacion}T00:00:00`)
          .toISOString()
          .split("T")[0]
      : "";

    setData({
      denominacion: initial.denominacion ?? "",
      descripcion_breve: initial.descripcion_breve ?? "",
      monto_invertido: initial.monto_invertido ?? undefined,
      fecha_incorporacion: formattedDate,
    });
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
      newErrors.denominacion = "La denominacion es obligatoria";
    }

    if (!data.descripcion_breve.trim()) {
      newErrors.descripcion = "La descripcion es obligatoria";
    }

    if (!data.fecha_incorporacion) {
      newErrors.fecha_incorporacion = "La fecha es obligatoria";
    }

    if (data.monto_invertido === undefined || data.monto_invertido <= 0) {
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
    onSuccess: async (saved) => {
      const equipamientoId = isEdit ? Number(id) : saved.id;

      await qc.invalidateQueries({ queryKey: ["equipamiento"] });
      await qc.invalidateQueries({ queryKey: ["equipamiento", equipamientoId] });
      await qc.invalidateQueries({
        queryKey: ["equipamiento-historial", equipamientoId],
      });

      navigate(`/equipamiento/${equipamientoId}`, {
        replace: true,
        state: {
          successMessage: isEdit
            ? "Equipamiento actualizado con exito."
            : "Equipamiento creado con exito.",
        },
      });
    },
    onError: (error) => {
      const defaultMessage = isEdit
        ? "No se pudo actualizar el equipamiento."
        : "No se pudo crear el equipamiento.";

      let backendMessage = defaultMessage;

      if (error instanceof HttpError) {
        const body = error.body as
          | { message?: string; error?: string; detalle?: string }
          | undefined;

        backendMessage =
          body?.error || body?.message || body?.detalle || defaultMessage;

        const lowerMessage = backendMessage.toLowerCase();

        if (lowerMessage.includes("denominacion")) {
          setErrors((prev) => ({
            ...prev,
            denominacion: backendMessage,
          }));
        } else if (lowerMessage.includes("descripcion")) {
          setErrors((prev) => ({
            ...prev,
            descripcion: backendMessage,
          }));
        } else if (lowerMessage.includes("monto")) {
          setErrors((prev) => ({
            ...prev,
            monto: backendMessage,
          }));
        } else if (lowerMessage.includes("fecha")) {
          setErrors((prev) => ({
            ...prev,
            fecha_incorporacion: backendMessage,
          }));
        }
      }

      setErrorMessage(backendMessage);
      setShowError(true);
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uct) return;
    if (!validate()) return;

    const payload = {
      grupo_utn_id: uct.id,
      denominacion: data.denominacion.trim(),
      descripcion_breve: data.descripcion_breve.trim(),
      fecha_incorporacion: data.fecha_incorporacion,
      monto_invertido: data.monto_invertido!,
    };

    if (!isEdit) {
      await mutateAsync(payload);
      return;
    }

    const initialPayload = {
      grupo_utn_id: uct.id,
      denominacion: initial?.denominacion ?? "",
      descripcion_breve: initial?.descripcion_breve ?? "",
      fecha_incorporacion: initial?.fecha_incorporacion ?? "",
      monto_invertido: initial?.monto_invertido ?? undefined,
    };

    const changedPayload = Object.fromEntries(
      Object.entries(payload).filter(([key, value]) => {
        return initialPayload[key as keyof typeof initialPayload] !== value;
      })
    );

    if (Object.keys(changedPayload).length === 0) {
      navigate(`/equipamiento/${id}`, {
        replace: true,
        state: {
          successMessage: "No hubo cambios para actualizar.",
        },
      });
      return;
    }

    await mutateAsync(changedPayload);
  };

  if (isLoading) return <p className="text-slate-500">Cargando...</p>;

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold leading-none md:text-3xl">
        {isEdit ? "Editar equipamiento" : "Nuevo equipamiento"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <Field label="Denominacion">
          <>
            <input
              className={inputClass("denominacion")}
              value={data.denominacion}
              placeholder="Ej: Osciloscopio digital Tektronix"
              onChange={(e) => {
                setData((d) => ({
                  ...d,
                  denominacion: e.target.value,
                }));
                if (e.target.value.trim()) clearError("denominacion");
              }}
            />
            {errors.denominacion && (
              <p className="mt-1 text-sm text-red-500">{errors.denominacion}</p>
            )}
          </>
        </Field>

        <Field label="Descripcion breve">
          <>
            <input
              className={inputClass("descripcion")}
              value={data.descripcion_breve}
              placeholder="Describir brevemente el equipamiento y su uso"
              onChange={(e) => {
                setData((d) => ({
                  ...d,
                  descripcion_breve: e.target.value,
                }));
                if (e.target.value.trim()) clearError("descripcion");
              }}
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-500">{errors.descripcion}</p>
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
              placeholder="Ej: 1250000"
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
              <p className="mt-1 text-sm text-red-500">{errors.monto}</p>
            )}
          </>
        </Field>

        <Field label="Fecha de incorporacion">
          <DatePicker
            value={
              data.fecha_incorporacion
                ? new Date(`${data.fecha_incorporacion}T00:00:00`)
                : null
            }
            onChange={(dt) => {
              setData((d) => ({
                ...d,
                fecha_incorporacion: dt ? dt.toISOString().split("T")[0] : "",
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

          <Button type="submit" size="sm" disabled={isPending || !uct}>
            {isPending
              ? isEdit
                ? "Actualizando..."
                : "Guardando..."
              : isEdit
                ? "Actualizar"
                : "Guardar"}
          </Button>
        </div>
      </form>

      <SuccessToast
        open={showError}
        message={errorMessage}
        onClose={() => setShowError(false)}
        variant="error"
      />

      {uctGuard}
    </section>
  );
}
