import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Field from "@/components/Field";
import DatePicker from "@/components/Calendar";
import SuccessToast from "@/components/SuccessToast";
import { HttpError } from "@/lib/http";
import { createMemoria } from "@/modules/memorias/services/memoriasService";

export default function MemoriaForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFin, setPeriodoFin] = useState("");
  const [fechaApertura, setFechaApertura] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!periodoInicio) {
      nextErrors.periodoInicio = "Debe ingresar el inicio del periodo.";
    }

    if (!periodoFin) {
      nextErrors.periodoFin = "Debe ingresar el fin del periodo.";
    }

    if (periodoInicio && periodoFin && periodoFin < periodoInicio) {
      nextErrors.periodoFin =
        "La fecha de fin no puede ser anterior al inicio del periodo.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () =>
      createMemoria({
        periodo_inicio: periodoInicio,
        periodo_fin: periodoFin,
        fecha_apertura: fechaApertura || undefined,
      }),
    onSuccess: async (memoria) => {
      await queryClient.invalidateQueries({ queryKey: ["memorias"] });
      await queryClient.invalidateQueries({ queryKey: ["memoria", memoria.id] });

      navigate(`/memorias/${memoria.id}`, {
        replace: true,
        state: { successMessage: "Memoria creada con exito." },
      });
    },
    onError: (error) => {
      const fallback = "No se pudo crear la memoria.";

      if (error instanceof HttpError) {
        const body = error.body as
          | { error?: string; message?: string; detalle?: string }
          | undefined;

        setErrorMessage(body?.error || body?.message || body?.detalle || fallback);
      } else if (error instanceof Error) {
        setErrorMessage(error.message || fallback);
      } else {
        setErrorMessage(fallback);
      }

      setShowError(true);
    },
  });

  const inputClass = (field: string) =>
    errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : "";

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold leading-none md:text-3xl">
        Nueva memoria
      </h2>

      <form
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!validate()) return;
          await mutateAsync();
        }}
      >
        <Field label="Periodo de inicio">
          <DatePicker
            value={periodoInicio ? new Date(`${periodoInicio}T00:00:00`) : null}
            onChange={(date) => {
              setPeriodoInicio(date ? date.toISOString().split("T")[0] : "");
              if (errors.periodoInicio) {
                setErrors((prev) => ({ ...prev, periodoInicio: "" }));
              }
            }}
            helperText={errors.periodoInicio || "DD/MM/AAAA"}
            className={inputClass("periodoInicio")}
          />
        </Field>

        <Field label="Periodo de fin">
          <DatePicker
            value={periodoFin ? new Date(`${periodoFin}T00:00:00`) : null}
            onChange={(date) => {
              setPeriodoFin(date ? date.toISOString().split("T")[0] : "");
              if (errors.periodoFin) {
                setErrors((prev) => ({ ...prev, periodoFin: "" }));
              }
            }}
            helperText={errors.periodoFin || "DD/MM/AAAA"}
            className={inputClass("periodoFin")}
          />
        </Field>

        <Field label="Fecha de apertura">
          <DatePicker
            value={fechaApertura ? new Date(fechaApertura) : null}
            onChange={(date) => {
              setFechaApertura(date ? date.toISOString().slice(0, 19) : "");
            }}
            helperText="Opcional. Si no se informa, se usa la fecha actual."
          />
        </Field>

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate("/memorias")}
          >
            Volver
          </Button>

          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>

      <SuccessToast
        open={showError}
        message={errorMessage}
        onClose={() => setShowError(false)}
        variant="error"
      />
    </section>
  );
}
