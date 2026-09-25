import { applyFieldErrors } from "@/lib/httpError";
import { hasLetter } from "../../../lib/textValidation";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import DraftLeaveControls from "@/modules/shared/components/DraftLeaveControls";
import Calendar from "@/components/Calendar";
import Field from "@/components/Field";
import SuccessToast from "@/components/SuccessToast";
import { getErrorMessage } from "@/lib/httpError";
import { useInvestigadores } from "@/modules/personal/hooks/useInvestigadores";
import { toCivilDateString } from "@/utils/dateTime";
import { useAuth } from "@/context/AuthContext";
import { useFormDraft } from "@/modules/shared/hooks/useFormDraft";
import DraftRecoveryNotice from "@/modules/shared/components/DraftRecoveryNotice";
import {
  actualizarParticipacion,
  crearParticipacion,
  getParticipacionById,
  type ParticipacionPayload,
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
  const { user } = useAuth();

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

  const { availableDraft, sourceChanged, restoreDraft, discardDraft, clearDraft, saveStatus, blocker, requestLeave, keepAndLeave, discardAndLeave } = useFormDraft({
    userId: user?.id,
    module: "proyectos-participaciones",
    recordId: id,
    value: { investigadorId, nombreEvento, formaParticipacion, fecha: toCivilDateString(fecha) },
    ready: !isEdit || (!isLoading && Boolean(initialData)),
    autosave: false,
    hasContent: (draft) => Boolean(draft.investigadorId || draft.nombreEvento || draft.formaParticipacion || draft.fecha),
    onRestore: (draft) => { setInvestigadorId(draft.investigadorId); setNombreEvento(draft.nombreEvento); setFormaParticipacion(draft.formaParticipacion); setFecha(draft.fecha ? new Date(`${draft.fecha}T00:00:00`) : null); },
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
    } else if (!hasLetter(nombreEvento)) {
      newErrors.nombreEvento = "El nombre del evento debe contener letras";
    }

    if (!formaParticipacion) {
      newErrors.formaParticipacion = "Debe seleccionar una forma de participación";
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
    mutationFn: (
      input:
        | { mode: "create"; payload: ParticipacionPayload }
        | { mode: "edit"; payload: Partial<ParticipacionPayload> }
    ) =>
      input.mode === "edit"
        ? actualizarParticipacion(Number(id), input.payload)
        : crearParticipacion(input.payload),
    onSuccess: async (saved) => {
      clearDraft();
      const participacionId = isEdit ? Number(id) : saved.id;

      await qc.invalidateQueries({ queryKey: ["participaciones"] });
      await qc.invalidateQueries({ queryKey: ["participacion", participacionId] });
      await qc.invalidateQueries({
        queryKey: ["participacion-historial", participacionId],
      });

      navigate(isEdit ? `/participaciones/${participacionId}` : "/participaciones", {
        replace: true,
        state: {
          successMessage: isEdit
            ? "Participación actualizada con éxito."
            : "Participación creada con éxito.",
        },
      });
    },
    onError: (error) => {
      if (applyFieldErrors(error, setErrors, ["investigador","nombreEvento","formaParticipacion","fecha"])) return;
      setErrorMessage(getErrorMessage(error, isEdit
        ? "Lo sentimos, no pudimos actualizar la participación. Revise los datos e intente nuevamente."
        : "Lo sentimos, no pudimos crear la participación. Revise los datos e intente nuevamente."));
      setShowError(true);
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mutation.isPending) return;
    if (!validate()) return;

    const payload = {
      investigador_id: investigadorId!,
      nombre_evento: nombreEvento.trim(),
      forma_participacion: formaParticipacion,
      fecha: formatDateStr(fecha)!,
    };

    if (!isEdit) {
      await mutation.mutateAsync({ mode: "create", payload });
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
      clearDraft();
      navigate(`/participaciones/${id}`, {
        replace: true,
        state: {
          successMessage: "No hubo cambios para actualizar.",
        },
      });
      return;
    }

    await mutation.mutateAsync({ mode: "edit", payload: changedPayload });
  };

  if (isEdit && isLoading) {
    return <p className="text-slate-500">Cargando participación...</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold leading-none md:text-3xl">
        {isEdit ? "Editar participación" : "Nueva participación relevante"}
      </h2>

      {availableDraft && <DraftRecoveryNotice savedAt={availableDraft.saved_at} sourceChanged={sourceChanged} onRestore={restoreDraft} onDiscard={discardDraft} />}
      <DraftLeaveControls blocker={blocker} saveStatus={saveStatus} keepAndLeave={keepAndLeave} discardAndLeave={discardAndLeave} />

      <form
        noValidate
        onSubmit={submit}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <Field required label="Investigador" name="investigador" error={errors.investigador}>
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

        <Field required label="Nombre del evento" name="nombreEvento" error={errors.nombreEvento}>
          <>
            <input
              type="text"
              className={inputClass("nombreEvento")}
              value={nombreEvento}
              onChange={(e) => {
                setNombreEvento(e.target.value);
                if (e.target.value.trim()) clearError("nombreEvento");
              }}
              placeholder="Ej: Congreso Argentino de Ingeniería"
            />
            {errors.nombreEvento && (
              <p className="mt-1 text-sm text-red-500">{errors.nombreEvento}</p>
            )}
          </>
        </Field>

        <Field required label="Forma de participación" name="formaParticipacion" error={errors.formaParticipacion}>
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
              <p className="mt-1 text-sm text-red-500">
                {errors.formaParticipacion}
              </p>
            )}
          </>
        </Field>

        <Field required label="Fecha" name="fecha" error={errors.fecha}>
          <Calendar
            value={fecha}
            onChange={(date) => {
              setFecha(date);
              if (date) clearError("fecha");
            }}
            className={inputClass("fecha")}
            helperText="DD/MM/AAAA"
          />
        </Field>

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => requestLeave(() => navigate(-1))}
          >
            Volver
          </Button>

          <Button type="submit" size="sm" disabled={mutation.isPending} loading={mutation.isPending} loadingText="Guardando...">
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
