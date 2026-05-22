import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import Field from "@/components/Field";
import SuccessToast from "@/components/SuccessToast";
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
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!initialData) return;

    setTitulo(initialData.titulo ?? "");
    setDescripcion(initialData.descripcion ?? "");
    setFechaPublicacion(
      initialData.fecha_publicacion
        ? new Date(`${initialData.fecha_publicacion}T00:00:00`)
        : null
    );
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

    if (!titulo.trim()) {
      newErrors.titulo = "Debe ingresar titulo";
    } else if (titulo.trim().length < 5) {
      newErrors.titulo = "El titulo debe tener al menos 5 caracteres";
    }

    if (!descripcion.trim()) {
      newErrors.descripcion = "Debe ingresar descripcion";
    } else if (descripcion.trim().length < 10) {
      newErrors.descripcion =
        "La descripcion debe tener al menos 10 caracteres";
    }

    if (!fechaPublicacion) {
      newErrors.fecha = "Debe seleccionar fecha";
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
        ? updateArticulo(Number(id), payload)
        : createArticulo(payload),
    onSuccess: async (saved) => {
      const articuloId = isEdit ? Number(id) : saved.id;

      await qc.invalidateQueries({ queryKey: ["articulos-divulgacion"] });
      await qc.invalidateQueries({ queryKey: ["articulo-divulgacion", articuloId] });
      await qc.invalidateQueries({
        queryKey: ["articulo-divulgacion-historial", articuloId],
      });

      navigate(`/articulos-divulgacion/${articuloId}`, {
        replace: true,
        state: {
          successMessage: isEdit
            ? "Articulo actualizado con exito."
            : "Articulo creado con exito.",
        },
      });
    },
    onError: (error) => {
      const defaultMessage = isEdit
        ? "No se pudo actualizar el articulo de divulgacion."
        : "No se pudo crear el articulo de divulgacion.";

      let backendMessage = defaultMessage;

      if (error instanceof HttpError) {
        const body = error.body as
          | { message?: string; error?: string; detalle?: string }
          | undefined;

        backendMessage = body?.error || body?.message || body?.detalle || defaultMessage;

        const lowerMessage = backendMessage.toLowerCase();

        if (lowerMessage.includes("titulo")) {
          setErrors((prev) => ({
            ...prev,
            titulo: backendMessage,
          }));
        } else if (lowerMessage.includes("descripcion")) {
          setErrors((prev) => ({
            ...prev,
            descripcion: backendMessage,
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
    if (!uct) return;

    const payload = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      fecha_publicacion: formatDateStr(fechaPublicacion)!,
      grupo_utn_id: uct.id,
    };

    if (!isEdit) {
      await mutation.mutateAsync(payload);
      return;
    }

    const initialPayload = {
      titulo: initialData?.titulo ?? "",
      descripcion: initialData?.descripcion ?? "",
      fecha_publicacion: initialData?.fecha_publicacion ?? null,
      grupo_utn_id: uct.id,
    };

    const changedPayload = Object.fromEntries(
      Object.entries(payload).filter(([key, value]) => {
        return initialPayload[key as keyof typeof initialPayload] !== value;
      })
    );

    if (Object.keys(changedPayload).length === 0) {
      navigate(`/articulos-divulgacion/${id}`, {
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
    return <p className="text-slate-500">Cargando articulo...</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold leading-none md:text-3xl">
        {isEdit
          ? "Editar articulo de divulgacion"
          : "Nuevo articulo de divulgacion"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <Field label="Titulo">
          <>
            <input
              type="text"
              className={inputClass("titulo")}
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                if (e.target.value.trim()) clearError("titulo");
              }}
              placeholder="Ej: Impacto de la investigacion en la comunidad"
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-500">{errors.titulo}</p>
            )}
          </>
        </Field>

        <Field label="Descripcion">
          <>
            <textarea
              className={`${inputClass("descripcion")} min-h-[100px]`}
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                if (e.target.value.trim()) clearError("descripcion");
              }}
              placeholder="Ej: Articulo orientado a la divulgacion de resultados cientificos para publico general"
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-500">{errors.descripcion}</p>
            )}
          </>
        </Field>

        <Field label="Fecha de publicacion">
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
