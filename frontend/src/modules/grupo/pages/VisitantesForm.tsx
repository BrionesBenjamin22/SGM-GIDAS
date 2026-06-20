import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import Field from "@/components/Field";
import SuccessToast from "@/components/SuccessToast";
import { HttpError } from "@/lib/http";
import {
  actualizarVisitante,
  crearVisitante,
  getTiposVisita,
  getVisitanteById,
  type TipoVisitaOption,
} from "@/modules/grupo/services/visitantesServices";
import { useUctGuard } from "@/modules/grupo/hooks/useUctGuard";

export default function VisitantesForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const isEdit = Boolean(id);
  const { uct, uctGuard } = useUctGuard();

  const { data: tiposVisita = [] } = useQuery({
    queryKey: ["tipos-visita"],
    queryFn: getTiposVisita,
    staleTime: 60_000,
  });

  const { data: initialData, isLoading } = useQuery({
    queryKey: ["visitante", id],
    queryFn: () => (id ? getVisitanteById(Number(id)) : null),
    enabled: isEdit,
  });

  const [razon, setRazon] = useState("");
  const [fecha, setFecha] = useState<Date | null>(null);
  const [procedencia, setProcedencia] = useState("");
  const [tipoVisitaId, setTipoVisitaId] = useState<number | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!initialData) return;

    setRazon(initialData.razon ?? "");
    setFecha(initialData.fecha ? new Date(`${initialData.fecha}T00:00:00`) : null);
    setProcedencia(initialData.procedencia ?? "");
    setTipoVisitaId(initialData.tipo_visita_id ?? null);
  }, [initialData]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!razon.trim()) {
      newErrors.razon = "Debe ingresar razon de la visita";
    }

    if (!fecha) {
      newErrors.fecha = "Debe seleccionar fecha";
    }

    if (!procedencia.trim()) {
      newErrors.procedencia = "Debe ingresar procedencia";
    } else if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(procedencia)) {
      newErrors.procedencia = "La procedencia no puede ser numerica.";
    }

    if (!tipoVisitaId) {
      newErrors.tipoVisita = "Debe seleccionar tipo de visita";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDateStr = (date: Date | null) => {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit
        ? actualizarVisitante(Number(id), payload)
        : crearVisitante(payload),
    onSuccess: async (saved) => {
      const visitanteId = isEdit ? Number(id) : saved.id;

      await qc.invalidateQueries({ queryKey: ["visitantes"] });
      await qc.invalidateQueries({ queryKey: ["visitante", visitanteId] });
      await qc.invalidateQueries({
        queryKey: ["visitante-historial", visitanteId],
      });

      navigate(`/visitantes/${visitanteId}`, {
        replace: true,
        state: {
          successMessage: isEdit
            ? "Visitante actualizado con exito."
            : "Visitante creado con exito.",
        },
      });
    },
    onError: (error) => {
      const defaultMessage = isEdit
        ? "No se pudo actualizar la visita."
        : "No se pudo crear la visita.";

      let backendMessage = defaultMessage;

      if (error instanceof HttpError) {
        const body = error.body as
          | { message?: string; error?: string; detalle?: string }
          | undefined;

        backendMessage =
          body?.error || body?.message || body?.detalle || defaultMessage;

        const lowerMessage = backendMessage.toLowerCase();

        if (lowerMessage.includes("razon")) {
          setErrors((prev) => ({
            ...prev,
            razon: backendMessage,
          }));
        } else if (lowerMessage.includes("procedencia")) {
          setErrors((prev) => ({
            ...prev,
            procedencia: backendMessage,
          }));
        } else if (lowerMessage.includes("fecha")) {
          setErrors((prev) => ({
            ...prev,
            fecha: backendMessage,
          }));
        } else if (lowerMessage.includes("tipo")) {
          setErrors((prev) => ({
            ...prev,
            tipoVisita: backendMessage,
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
      razon: razon.trim(),
      fecha: formatDateStr(fecha)!,
      procedencia: procedencia.trim(),
      tipo_visita_id: tipoVisitaId!,
      grupo_utn_id: uct.id,
    };

    if (!isEdit) {
      await mutation.mutateAsync(payload);
      return;
    }

    const initialPayload = {
      razon: initialData?.razon ?? "",
      fecha: initialData?.fecha ?? null,
      procedencia: initialData?.procedencia ?? "",
      tipo_visita_id: initialData?.tipo_visita_id ?? null,
      grupo_utn_id: uct.id,
    };

    const changedPayload = Object.fromEntries(
      Object.entries(payload).filter(([key, value]) => {
        return initialPayload[key as keyof typeof initialPayload] !== value;
      })
    );

    if (Object.keys(changedPayload).length === 0) {
      navigate(`/visitantes/${id}`, {
        replace: true,
        state: {
          successMessage: "No hubo cambios para actualizar.",
        },
      });
      return;
    }

    await mutation.mutateAsync(changedPayload);
  };

  if (isEdit && isLoading) {
    return <p className="text-slate-500">Cargando visitante...</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold leading-none md:text-3xl">
        {isEdit ? "Editar visitante" : "Nueva visita academica"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <Field label="Razon de la visita">
          <>
            <textarea
              className={`${inputClass("razon")} min-h-[80px]`}
              value={razon}
              onChange={(e) => {
                setRazon(e.target.value);
                if (e.target.value.trim()) clearError("razon");
              }}
            />
            {errors.razon && (
              <p className="mt-1 text-sm text-red-500">{errors.razon}</p>
            )}
          </>
        </Field>

        <Field label="Fecha">
          <Calendar
            value={fecha}
            onChange={(date) => {
              setFecha(date);
              if (date) clearError("fecha");
            }}
            className={inputClass("fecha")}
            helperText={errors.fecha ?? "DD/MM/AAAA"}
          />
        </Field>

        <Field label="Procedencia">
          <>
            <input
              type="text"
              className={inputClass("procedencia")}
              value={procedencia}
              onChange={(e) => {
                setProcedencia(e.target.value);
                if (e.target.value.trim()) clearError("procedencia");
              }}
              placeholder="Ej: Universidad Nacional de Cordoba"
            />
            {errors.procedencia && (
              <p className="mt-1 text-sm text-red-500">{errors.procedencia}</p>
            )}
          </>
        </Field>

        <Field label="Tipo de visita">
          <>
            <select
              className={`${inputClass("tipoVisita")} ${
                !tipoVisitaId ? "text-slate-400" : "text-slate-900"
              }`}
              value={tipoVisitaId ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setTipoVisitaId(value);
                if (value) clearError("tipoVisita");
              }}
            >
              <option value="" disabled>
                Seleccionar tipo de visita
              </option>
              {tiposVisita.map((t: TipoVisitaOption) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
            {errors.tipoVisita && (
              <p className="mt-1 text-sm text-red-500">{errors.tipoVisita}</p>
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

          <Button type="submit" size="sm" disabled={mutation.isPending || !uct}>
            {mutation.isPending
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
