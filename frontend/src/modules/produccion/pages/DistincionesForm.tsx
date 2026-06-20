import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import Field from "@/components/Field";
import SuccessToast from "@/components/SuccessToast";
import { HttpError } from "@/lib/http";
import {
  crearDistincion,
  getDistincionById,
  actualizarDistincion,
} from "@/modules/produccion/services/distincionesServices";
import {
  getProyectos,
  type Proyecto,
} from "@/modules/proyectos/services/proyectosServices";
import { useUct } from "@/modules/grupo/hooks/useUct";

export default function DistincionesForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { uct } = useUct();

  const isEdit = Boolean(id);

  const { data: proyectos = [] } = useQuery({
    queryKey: ["proyectos"],
    queryFn: () => getProyectos(),
    staleTime: 60_000,
  });

  const { data: initialData, isLoading } = useQuery({
    queryKey: ["distincion", id],
    queryFn: () => (id ? getDistincionById(Number(id)) : null),
    enabled: isEdit,
  });

  const [fecha, setFecha] = useState<Date | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [proyectoId, setProyectoId] = useState<number | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!initialData) return;

    setFecha(initialData.fecha ? new Date(`${initialData.fecha}T00:00:00`) : null);
    setDescripcion(initialData.descripcion ?? "");
    setProyectoId(initialData.proyecto?.id ?? null);
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

    if (!fecha) {
      newErrors.fecha = "Debe seleccionar fecha";
    }

    if (!descripcion.trim()) {
      newErrors.descripcion = "Debe ingresar descripcion";
    }

    if (!proyectoId) {
      newErrors.proyecto = "Debe seleccionar un proyecto de investigacion";
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
        ? actualizarDistincion(Number(id), payload)
        : crearDistincion(payload),
    onSuccess: async (saved) => {
      const distincionId = isEdit ? Number(id) : saved.id;

      await qc.invalidateQueries({ queryKey: ["distinciones"] });
      await qc.invalidateQueries({ queryKey: ["distincion", distincionId] });
      await qc.invalidateQueries({ queryKey: ["distincion-historial", distincionId] });

      navigate(`/distinciones/${distincionId}`, {
        replace: true,
        state: {
          successMessage: isEdit
            ? "Distincion actualizada con exito."
            : "Distincion creada con exito.",
        },
      });
    },
    onError: (error) => {
      const defaultMessage = isEdit
        ? "No se pudo actualizar la distincion."
        : "No se pudo crear la distincion.";

      let backendMessage = defaultMessage;

      if (error instanceof HttpError && error.body && typeof error.body === "object") {
        const body = error.body as Record<string, unknown>;
        backendMessage =
          typeof body.error === "string"
            ? body.error
            : typeof body.message === "string"
              ? body.message
              : typeof body.detalle === "string"
                ? body.detalle
                : defaultMessage;

        const lowerMessage = backendMessage.toLowerCase();

        if (lowerMessage.includes("fecha")) {
          setErrors((prev) => ({ ...prev, fecha: backendMessage }));
        } else if (lowerMessage.includes("descripcion")) {
          setErrors((prev) => ({ ...prev, descripcion: backendMessage }));
        } else if (lowerMessage.includes("proyecto")) {
          setErrors((prev) => ({ ...prev, proyecto: backendMessage }));
        }
      }

      setErrorMessage(backendMessage);
      setShowError(true);
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!uct) return;

    const payload = {
      fecha: formatDateStr(fecha)!,
      descripcion: descripcion.trim(),
      proyecto_investigacion_id: proyectoId!,
    };

    if (!isEdit) {
      await mutation.mutateAsync(payload);
      return;
    }

    const initialPayload = {
      fecha: initialData?.fecha ?? null,
      descripcion: initialData?.descripcion ?? "",
      proyecto_investigacion_id: initialData?.proyecto?.id ?? null,
    };

    const changedPayload = Object.fromEntries(
      Object.entries(payload).filter(([key, value]) => {
        return initialPayload[key as keyof typeof initialPayload] !== value;
      })
    );

    if (Object.keys(changedPayload).length === 0) {
      navigate(`/distinciones/${id}`, {
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
    return <p className="text-slate-500">Cargando distincion...</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold leading-none md:text-3xl">
        {isEdit ? "Editar distincion" : "Nueva distincion recibida"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
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

        <Field label="Descripcion">
          <>
            <textarea
              className={`${inputClass("descripcion")} min-h-[80px]`}
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                if (e.target.value.trim()) clearError("descripcion");
              }}
              placeholder="Ej: Reconocimiento por aporte cientifico"
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-500">{errors.descripcion}</p>
            )}
          </>
        </Field>

        <Field label="Proyecto de investigacion">
          <>
            <select
              className={`${inputClass("proyecto")} ${
                !proyectoId ? "text-slate-400" : "text-slate-900"
              }`}
              value={proyectoId ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setProyectoId(value);
                if (value) clearError("proyecto");
              }}
            >
              <option value="" disabled>
                Seleccionar proyecto
              </option>
              {proyectos.map((p: Proyecto) => (
                <option key={p.id} value={p.id}>
                  {p.codigoProyecto} - {p.nombreProyecto}
                </option>
              ))}
            </select>
            {errors.proyecto && (
              <p className="mt-1 text-sm text-red-500">{errors.proyecto}</p>
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
    </section>
  );
}
