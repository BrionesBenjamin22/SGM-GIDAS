import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import Field from "@/components/Field";
import { HttpError } from "@/lib/http";
import {
  crearDistincion,
  getDistincionById,
  actualizarDistincion,
} from "@/services/distincionesServices";
import {
  getProyectos,
  type Proyecto,
} from "@/services/proyectoInvestigacionServices";
import { useUct } from "@/hooks/useUct";

export default function DistincionesForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { uct } = useUct();

  const isEdit = Boolean(id);

  const { data: proyectos = [] } = useQuery({
    queryKey: ["proyectos"],
    queryFn: getProyectos,
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

  useEffect(() => {
    if (!initialData) return;

    setFecha(initialData.fecha ? new Date(initialData.fecha) : null);
    setDescripcion(initialData.descripcion ?? "");
    setProyectoId(initialData.proyecto_investigacion_id ?? null);
  }, [initialData]);

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit
        ? actualizarDistincion(Number(id), payload)
        : crearDistincion(payload),
    onSuccess: async (saved) => {
      await qc.invalidateQueries({ queryKey: ["distinciones"] });
      await qc.invalidateQueries({ queryKey: ["distincion", id] });

      if (isEdit) {
        navigate(`/distinciones/${id}`, {
          state: {
            successMessage: "Distinción actualizada con éxito!",
          },
        });
      } else {
        navigate(`/distinciones/${saved.id}`, {
          state: {
            successMessage: "Distinción creada con éxito!",
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

    if (!fecha) {
      newErrors.fecha = "Debe seleccionar fecha";
    }

    if (!descripcion.trim()) {
      newErrors.descripcion = "Debe ingresar descripción";
    }

    if (!proyectoId) {
      newErrors.proyecto = "Debe seleccionar un proyecto de investigación";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!uct) return;

    const payload = {
      fecha: fecha!.toISOString().split("T")[0],
      descripcion: descripcion.trim(),
      proyecto_investigacion_id: proyectoId!,
      grupo_utn_id: uct.id,
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

        if (lowerMessage.includes("fecha")) {
          setErrors((prev) => ({
            ...prev,
            fecha: backendMessage,
          }));
          return;
        }

        if (
          lowerMessage.includes("descripcion") ||
          lowerMessage.includes("descripción")
        ) {
          setErrors((prev) => ({
            ...prev,
            descripcion: backendMessage,
          }));
          return;
        }

        if (lowerMessage.includes("proyecto")) {
          setErrors((prev) => ({
            ...prev,
            proyecto: backendMessage,
          }));
          return;
        }
      }

      setErrors((prev) => ({
        ...prev,
        general: "No se pudo guardar la distinción.",
      }));
    }
  };

  if (isEdit && isLoading) {
    return <p className="text-slate-500">Cargando distinción…</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        {isEdit ? "Editar distinción" : "Nueva distinción recibida"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
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

        <Field label="Descripción">
          <>
            <textarea
              className={`${inputClass("descripcion")} min-h-[80px]`}
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                if (e.target.value.trim()) clearError("descripcion");
              }}
              placeholder="Ej: Reconocimiento por aporte científico"
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm mt-1">
                {errors.descripcion}
              </p>
            )}
          </>
        </Field>

        <Field label="Proyecto de investigación">
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
                  {p.codigo} - {p.nombre}
                </option>
              ))}
            </select>
            {errors.proyecto && (
              <p className="text-red-500 text-sm mt-1">
                {errors.proyecto}
              </p>
            )}
          </>
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

          <Button type="submit" size="sm" disabled={mutation.isPending || !uct}>
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