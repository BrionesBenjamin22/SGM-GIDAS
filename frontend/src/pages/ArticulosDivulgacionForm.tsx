import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import Field from "@/components/Field";
import { HttpError } from "@/lib/http";
import { useUctGuard } from "@/hooks/useUctGuard";
import {
  createArticulo,
  getArticuloById,
  updateArticulo,
} from "@/services/articulosDivulgacionServices";

export default function ArticulosDivulgacionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { uct, uctGuard } = useUctGuard();

  const isEdit = Boolean(id);

  const { data: initialData, isLoading } = useQuery({
    queryKey: ["articulo-divulgacion", id],
    queryFn: () => (id ? getArticuloById(Number(id)) : null),
    enabled: isEdit,
  });

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaPublicacion, setFechaPublicacion] = useState<Date | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) return;

    setTitulo(initialData.titulo ?? "");
    setDescripcion(initialData.descripcion ?? "");
    setFechaPublicacion(
      initialData.fecha_publicacion
        ? new Date(initialData.fecha_publicacion)
        : null
    );
  }, [initialData]);

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit
        ? updateArticulo(Number(id), payload)
        : createArticulo(payload),
    onSuccess: async (saved) => {
      await qc.invalidateQueries({ queryKey: ["articulos-divulgacion"] });
      await qc.invalidateQueries({ queryKey: ["articulo-divulgacion", id] });

      if (isEdit) {
        navigate(`/articulos-divulgacion/${id}`, {
          state: {
            successMessage: "Artículo actualizado con éxito!",
          },
        });
      } else {
        navigate(`/articulos-divulgacion/${saved.id}`, {
          state: {
            successMessage: "Artículo creado con éxito!",
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

    if (!titulo.trim()) {
      newErrors.titulo = "Debe ingresar título";
    } else if (titulo.trim().length < 5) {
      newErrors.titulo = "El título debe tener al menos 5 caracteres";
    }

    if (!descripcion.trim()) {
      newErrors.descripcion = "Debe ingresar descripción";
    } else if (descripcion.trim().length < 10) {
      newErrors.descripcion =
        "La descripción debe tener al menos 10 caracteres";
    }

    if (!fechaPublicacion) {
      newErrors.fecha = "Debe seleccionar fecha";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!uct) return;

    const payload = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      fecha_publicacion: fechaPublicacion!.toISOString().split("T")[0],
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

        if (lowerMessage.includes("titulo") || lowerMessage.includes("título")) {
          setErrors((prev) => ({
            ...prev,
            titulo: backendMessage,
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
        general: "No se pudo guardar el artículo de divulgación.",
      }));
    }
  };

  if (isEdit && isLoading) {
    return <p className="text-slate-500">Cargando artículo…</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        {isEdit
          ? "Editar artículo de divulgación"
          : "Nuevo artículo de divulgación"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
      >
        <Field label="Título">
          <>
            <input
              type="text"
              className={inputClass("titulo")}
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                if (e.target.value.trim()) clearError("titulo");
              }}
              placeholder="Ej: Impacto de la investigación en la comunidad"
            />
            {errors.titulo && (
              <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>
            )}
          </>
        </Field>

        <Field label="Descripción">
          <>
            <textarea
              className={`${inputClass("descripcion")} min-h-[100px]`}
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                if (e.target.value.trim()) clearError("descripcion");
              }}
              placeholder="Ej: Artículo orientado a la divulgación de resultados científicos para público general"
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
            )}
          </>
        </Field>

        <Field label="Fecha de publicación">
          <Calendar
            value={fechaPublicacion}
            onChange={(date) => {
              setFechaPublicacion(date);
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