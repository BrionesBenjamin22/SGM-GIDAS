import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import Field from "@/components/Field";
import { HttpError } from "@/lib/http";
import {
  crearVisitante,
  getVisitanteById,
  actualizarVisitante,
  getTiposVisita,
  type TipoVisitaOption,
} from "@/services/visitantesServices";
import { useUctGuard } from "@/hooks/useUctGuard";

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

  useEffect(() => {
    if (!initialData) return;

    setRazon(initialData.razon ?? "");
    if (initialData.fecha) setFecha(new Date(initialData.fecha));
    setProcedencia(initialData.procedencia ?? "");
    setTipoVisitaId(initialData.tipo_visita_id ?? null);
  }, [initialData]);

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit
        ? actualizarVisitante(Number(id), payload)
        : crearVisitante(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitantes"] });
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

    if (!razon.trim()) {
      newErrors.razon = "Debe ingresar razón de la visita";
    }

    if (!fecha) {
      newErrors.fecha = "Debe seleccionar fecha";
    }

    if (!procedencia.trim()) {
      newErrors.procedencia = "Debe ingresar procedencia";
    } else if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(procedencia)) {
      newErrors.procedencia = "La procedencia no puede ser numérica.";
    }

    if (!tipoVisitaId) {
      newErrors.tipoVisita = "Debe seleccionar tipo de visita";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uct) return;
    if (!validate()) return;

    const payload = {
      razon,
      fecha: fecha!.toISOString().split("T")[0],
      procedencia,
      tipo_visita_id: tipoVisitaId!,
      grupo_utn_id: uct.id,
    };

    try {
      await mutation.mutateAsync(payload);

      if (isEdit) {
        navigate(`/visitantes/${id}`, {
          state: {
            successMessage: "Visitante actualizado con éxito!",
          },
        });
      } else {
        navigate("/visitantes", {
          state: {
            successMessage: "Visitante creado con éxito!",
          },
        });
      }
    } catch (error) {
      if (error instanceof HttpError) {
        const body = error.body as
          | { message?: string; error?: string; detalle?: string }
          | undefined;

        const backendMessage =
          body?.error || body?.message || body?.detalle || "";

        if (
          backendMessage
            .toLowerCase()
            .includes("procedencia")
        ) {
          setErrors((prev) => ({
            ...prev,
            procedencia: backendMessage,
          }));
          return;
        }
      }

      setErrors((prev) => ({
        ...prev,
        general: "No se pudo guardar la visita.",
      }));
    }
  };

  if (isEdit && isLoading) {
    return <p className="text-slate-500">Cargando visitante…</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        {isEdit ? "Editar visitante" : "Nueva visita académica"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
      >
        <Field label="Razón de la visita">
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
              <p className="text-red-500 text-sm mt-1">{errors.razon}</p>
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
              placeholder="Ej: Universidad Nacional de Córdoba"
            />
            {errors.procedencia && (
              <p className="text-red-500 text-sm mt-1">
                {errors.procedencia}
              </p>
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
              <p className="text-red-500 text-sm mt-1">
                {errors.tipoVisita}
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

      {uctGuard}
    </section>
  );
}