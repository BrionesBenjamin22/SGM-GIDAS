import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import Field from "@/components/Field";
import SuccessToast from "@/components/SuccessToast";
import { HttpError } from "@/lib/http";
import { useInvestigadores } from "@/modules/personal/hooks/useInvestigadores";
import {
  actualizarParticipacion,
  crearParticipacion,
  getParticipacionById,
} from "@/modules/proyectos/services/participacionesServices";

const FORMAS_PARTICIPACION = [
  { value: "jurado", label: "Jurado" },
  { value: "evaluador", label: "Evaluador" },
  { value: "panelista", label: "Panelista" },
  { value: "comite", label: "Miembro de comite cientifico" },
];

export default function ParticipacionesForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const isEdit = Boolean(id);
  const { data: investigadores = [] } = useInvestigadores();

  const { data: initialData, isLoading } = useQuery({
    queryKey: ["participacion", id],
    queryFn: () => (id ? getParticipacionById(Number(id)) : null),
    enabled: isEdit,
  });

  const [investigadorId, setInvestigadorId] = useState<number | null>(null);
  const [nombreEvento, setNombreEvento] = useState("");
  const [formaParticipacion, setFormaParticipacion] = useState("");
  const [fecha, setFecha] = useState<Date | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!initialData) return;

    setInvestigadorId(initialData.investigador_id ?? null);
    setNombreEvento(initialData.nombre_evento ?? "");
    setFormaParticipacion(initialData.forma_participacion ?? "");
    setFecha(initialData.fecha ? new Date(`${initialData.fecha}T00:00:00`) : null);
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

    if (!investigadorId) {
      newErrors.investigador = "Debe seleccionar un investigador";
    }

    if (!nombreEvento.trim()) {
      newErrors.nombreEvento = "Debe ingresar el nombre del evento";
    }

    if (!formaParticipacion) {
      newErrors.formaParticipacion = "Debe seleccionar una forma de participacion";
    }

    if (!fecha) {
      newErrors.fecha = "Debe seleccionar una fecha";
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
        ? actualizarParticipacion(Number(id), payload)
        : crearParticipacion(payload),
    onSuccess: async (saved) => {
      const participacionId = isEdit ? Number(id) : saved.id;

      await qc.invalidateQueries({ queryKey: ["participaciones"] });
      await qc.invalidateQueries({ queryKey: ["participacion", participacionId] });
      await qc.invalidateQueries({
        queryKey: ["participacion-historial", participacionId],
      });

      navigate(`/participaciones/${participacionId}`, {
        replace: true,
        state: {
          successMessage: isEdit
            ? "Participacion actualizada con exito."
            : "Participacion creada con exito.",
        },
      });
    },
    onError: (error) => {
      const defaultMessage = isEdit
        ? "No se pudo actualizar la participacion."
        : "No se pudo crear la participacion.";

      let backendMessage = defaultMessage;

      if (error instanceof HttpError) {
        const body = error.body as
          | { message?: string; error?: string; detalle?: string }
          | undefined;

        backendMessage =
          body?.error || body?.message || body?.detalle || defaultMessage;

        const lowerMessage = backendMessage.toLowerCase();

        if (lowerMessage.includes("investigador")) {
          setErrors((prev) => ({
            ...prev,
            investigador: backendMessage,
          }));
        } else if (lowerMessage.includes("nombre") || lowerMessage.includes("evento")) {
          setErrors((prev) => ({
            ...prev,
            nombreEvento: backendMessage,
          }));
        } else if (
          lowerMessage.includes("forma") ||
          lowerMessage.includes("participacion")
        ) {
          setErrors((prev) => ({
            ...prev,
            formaParticipacion: backendMessage,
          }));
        } else if (lowerMessage.includes("fecha")) {
          setErrors((prev) => ({
            ...prev,
            fecha: backendMessage,
          }));
        }
      }

      setErrorMessage(backendMessage);
      setShowError(true);
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      investigador_id: investigadorId!,
      nombre_evento: nombreEvento.trim(),
      forma_participacion: formaParticipacion,
      fecha: formatDateStr(fecha)!,
    };

    if (!isEdit) {
      await mutation.mutateAsync(payload);
      return;
    }

    const initialPayload = {
      investigador_id: initialData?.investigador_id ?? null,
      nombre_evento: initialData?.nombre_evento ?? "",
      forma_participacion: initialData?.forma_participacion ?? "",
      fecha: initialData?.fecha ?? null,
    };

    const changedPayload = Object.fromEntries(
      Object.entries(payload).filter(([key, value]) => {
        return initialPayload[key as keyof typeof initialPayload] !== value;
      })
    );

    if (Object.keys(changedPayload).length === 0) {
      navigate(`/participaciones/${id}`, {
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
    return <p className="text-slate-500">Cargando participacion...</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold leading-none md:text-3xl">
        {isEdit ? "Editar participacion" : "Nueva participacion relevante"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <Field label="Investigador">
          <>
            <select
              className={`${inputClass("investigador")} ${
                !investigadorId ? "text-slate-400" : "text-slate-900"
              }`}
              value={investigadorId ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setInvestigadorId(value);
                if (value) clearError("investigador");
              }}
            >
              <option value="" disabled>
                Seleccionar investigador
              </option>
              {investigadores.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.nombre_apellido}
                </option>
              ))}
            </select>

            {errors.investigador && (
              <p className="mt-1 text-sm text-red-500">{errors.investigador}</p>
            )}
          </>
        </Field>

        <Field label="Nombre del evento">
          <>
            <input
              type="text"
              className={inputClass("nombreEvento")}
              value={nombreEvento}
              onChange={(e) => {
                setNombreEvento(e.target.value);
                if (e.target.value.trim()) clearError("nombreEvento");
              }}
              placeholder="Ej: Congreso Argentino de Ingenieria"
            />
            {errors.nombreEvento && (
              <p className="mt-1 text-sm text-red-500">{errors.nombreEvento}</p>
            )}
          </>
        </Field>

        <Field label="Forma de participacion">
          <>
            <select
              className={`${inputClass("formaParticipacion")} ${
                !formaParticipacion ? "text-slate-400" : "text-slate-900"
              }`}
              value={formaParticipacion}
              onChange={(e) => {
                setFormaParticipacion(e.target.value);
                if (e.target.value) clearError("formaParticipacion");
              }}
            >
              <option value="" disabled>
                Seleccionar forma de participacion
              </option>
              {FORMAS_PARTICIPACION.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {errors.formaParticipacion && (
              <p className="mt-1 text-sm text-red-500">
                {errors.formaParticipacion}
              </p>
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

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>

          <Button type="submit" size="sm" disabled={mutation.isPending}>
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
    </section>
  );
}
