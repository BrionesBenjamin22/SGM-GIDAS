import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import Field from "@/components/Field";
import { HttpError } from "@/lib/http";
import { toTitleCase } from "@/utils/format";
import { useInvestigadores } from "@/hooks/useInvestigadores";
import {
  crearParticipacion,
  getParticipacionById,
  actualizarParticipacion,
} from "@/services/participacionesServices";

const FORMAS_PARTICIPACION = [
  { value: "jurado", label: "Jurado" },
  { value: "evaluador", label: "Evaluador" },
  { value: "panelista", label: "Panelista" },
  { value: "comite", label: "Miembro de comité científico" },
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

  useEffect(() => {
    if (!initialData) return;

    setInvestigadorId(initialData.investigador_id ?? null);
    setNombreEvento(initialData.nombre_evento ?? "");
    setFormaParticipacion(initialData.forma_participacion ?? "");
    setFecha(initialData.fecha ? new Date(initialData.fecha) : null);
  }, [initialData]);

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit
        ? actualizarParticipacion(Number(id), payload)
        : crearParticipacion(payload),
    onSuccess: async (saved) => {
      await qc.invalidateQueries({ queryKey: ["participaciones"] });
      await qc.invalidateQueries({ queryKey: ["participacion", id] });

      if (isEdit) {
        navigate(`/participaciones/${id}`, {
          state: {
            successMessage: "Participación actualizada con éxito!",
          },
        });
      } else {
        navigate(`/participaciones/${saved.id}`, {
          state: {
            successMessage: "Participación creada con éxito!",
          },
        });
      }
    },
  });

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
      newErrors.formaParticipacion =
        "Debe seleccionar una forma de participación";
    }

    if (!fecha) {
      newErrors.fecha = "Debe seleccionar una fecha";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      investigador_id: investigadorId!,
      nombre_evento: toTitleCase(nombreEvento),
      forma_participacion: formaParticipacion,
      fecha: fecha!.toISOString().split("T")[0],
    };

    try {
      await mutation.mutateAsync(payload);
    } catch (error) {
      if (error instanceof HttpError) {
        const body = error.body as
          | { message?: string; error?: string; detalle?: string }
          | undefined;

        const backendMessage =
          body?.error || body?.message || body?.detalle || "";

        const lowerMessage = backendMessage.toLowerCase();

        if (lowerMessage.includes("investigador")) {
          setErrors((prev) => ({
            ...prev,
            investigador: backendMessage,
          }));
          return;
        }

        if (lowerMessage.includes("nombre") || lowerMessage.includes("evento")) {
          setErrors((prev) => ({
            ...prev,
            nombreEvento: backendMessage,
          }));
          return;
        }

        if (
          lowerMessage.includes("forma") ||
          lowerMessage.includes("participación") ||
          lowerMessage.includes("participacion")
        ) {
          setErrors((prev) => ({
            ...prev,
            formaParticipacion: backendMessage,
          }));
          return;
        }

        if (lowerMessage.includes("fecha")) {
          setErrors((prev) => ({
            ...prev,
            fecha: backendMessage,
          }));
          return;
        }
      }

      setErrors((prev) => ({
        ...prev,
        general: "No se pudo guardar la participación.",
      }));
    }
  };

  if (isEdit && isLoading) {
    return <p className="text-slate-500">Cargando participación…</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        {isEdit ? "Editar participación" : "Nueva participación relevante"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
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
              <p className="text-red-500 text-sm mt-1">
                {errors.investigador}
              </p>
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
              onBlur={() => {
                if (nombreEvento.trim()) {
                  setNombreEvento(toTitleCase(nombreEvento));
                }
              }}
              placeholder="Ej: Congreso Argentino de Ingeniería"
            />
            {errors.nombreEvento && (
              <p className="text-red-500 text-sm mt-1">
                {errors.nombreEvento}
              </p>
            )}
          </>
        </Field>

        <Field label="Forma de participación">
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
                Seleccionar forma de participación
              </option>
              {FORMAS_PARTICIPACION.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {errors.formaParticipacion && (
              <p className="text-red-500 text-sm mt-1">
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

        {errors.general && (
          <p className="text-red-500 text-sm">{errors.general}</p>
        )}

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
              ? "Guardando…"
              : isEdit
                ? "Actualizar"
                : "Guardar"}
          </Button>
        </div>
      </form>
    </section>
  );
}