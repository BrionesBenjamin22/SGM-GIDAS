import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import AutoresField from "@/components/AutoresField";
import DatePicker from "@/components/Calendar";
import Field from "@/components/Field";
import SuccessToast from "@/components/SuccessToast";
import { HttpError } from "@/lib/http";
import {
  addAutorToDocumento,
  createDocumentacion,
  getDocumentacionById,
  removeAutorFromDocumentacion,
  updateDocumentacion,
  type Autor,
} from "@/services/documentacionServices";
import { getAutores, createAutor } from "@/services/autoresService";
import { useUctGuard } from "@/hooks/useUctGuard";

export default function DocumentacionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { uct, uctGuard } = useUctGuard();
  const isEdit = Boolean(id);

  const { data: initial, isLoading } = useQuery({
    queryKey: ["documentacion", id],
    queryFn: () => (id ? getDocumentacionById(Number(id)) : null),
    enabled: isEdit,
  });

  const { data: autoresSistema = [] } = useQuery({
    queryKey: ["autores"],
    queryFn: getAutores,
  });

  const [data, setData] = useState({
    titulo: "",
    editorial: "",
    fecha: "",
  });
  const [autores, setAutores] = useState<Autor[]>([{ id: -Date.now(), nombre_apellido: "" }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!initial) return;

    setData({
      titulo: initial.titulo ?? "",
      editorial: initial.editorial ?? "",
      fecha: initial.fecha ?? "",
    });
    setAutores(
      initial.autores?.length
        ? initial.autores
        : [{ id: -Date.now(), nombre_apellido: "" }]
    );
  }, [initial]);

  const autoresDisponibles = useMemo(() => {
    const map = new Map<number, { id: number; nombre_apellido: string }>();

    for (const autor of autoresSistema) {
      map.set(autor.id, autor);
    }

    for (const autor of autores) {
      if (autor.id > 0) {
        map.set(autor.id, autor);
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.nombre_apellido.localeCompare(b.nombre_apellido)
    );
  }, [autoresSistema, autores]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const autoresValidos = autores.filter((autor) =>
    autor.id > 0 ? true : autor.nombre_apellido.trim() !== ""
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.titulo.trim()) newErrors.titulo = "Debe ingresar titulo";
    if (!data.editorial.trim()) newErrors.editorial = "Debe ingresar editorial";
    if (!data.fecha) newErrors.fecha = "Debe ingresar fecha";

    if (autoresValidos.length === 0) {
      newErrors.autores = "Debe ingresar al menos un autor";
    }

    if (
      autores.some((autor) => autor.id <= 0 && autor.nombre_apellido.trim() === "")
    ) {
      newErrors.autores = "No puede haber autores vacios";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!uct) {
        throw new Error("Grupo no disponible");
      }

      const persistedAutores: Autor[] = [];
      for (const autor of autoresValidos) {
        if (autor.id > 0) {
          persistedAutores.push(autor);
        } else {
          const creado = await createAutor(autor.nombre_apellido.trim());
          persistedAutores.push(creado);
        }
      }

      if (!isEdit) {
        const anio = new Date(`${data.fecha}T00:00:00`).getFullYear();

        const doc = await createDocumentacion({
          titulo: data.titulo.trim(),
          editorial: data.editorial.trim(),
          anio,
          fecha: data.fecha,
          grupo_id: uct.id,
        });

        for (const autor of persistedAutores) {
          await addAutorToDocumento(doc.id, autor.id);
        }

        return doc;
      }

      const initialPayload = {
        titulo: initial?.titulo ?? "",
        editorial: initial?.editorial ?? "",
        anio: initial?.anio ?? undefined,
        fecha: initial?.fecha ?? "",
        grupo_id: initial?.grupo_id ?? uct.id,
      };

      const anio = new Date(`${data.fecha}T00:00:00`).getFullYear();

      const payload = {
        titulo: data.titulo.trim(),
        editorial: data.editorial.trim(),
        anio,
        fecha: data.fecha,
        grupo_id: uct.id,
      };

      const changedPayload = Object.fromEntries(
        Object.entries(payload).filter(([key, value]) => {
          return initialPayload[key as keyof typeof initialPayload] !== value;
        })
      );

      const prevIds = initial?.autores?.map((autor) => autor.id) ?? [];
      const nextIds = persistedAutores.map((autor) => autor.id);
      const toAdd = nextIds.filter((autorId) => !prevIds.includes(autorId));
      const toRemove = prevIds.filter((autorId) => !nextIds.includes(autorId));

      if (
        Object.keys(changedPayload).length === 0 &&
        toAdd.length === 0 &&
        toRemove.length === 0
      ) {
        navigate(`/documentacion/${id}`, {
          replace: true,
          state: {
            successMessage: "No hubo cambios para actualizar.",
          },
        });
        return null;
      }

      let doc = initial;
      if (Object.keys(changedPayload).length > 0) {
        doc = await updateDocumentacion(Number(id), changedPayload);
      }

      for (const autorId of toAdd) {
        await addAutorToDocumento(Number(id), autorId);
      }

      for (const autorId of toRemove) {
        await removeAutorFromDocumentacion(Number(id), autorId);
      }

      return doc ?? initial ?? null;
    },
    onSuccess: async (saved) => {
      if (!saved) return;

      const documentacionId = isEdit ? Number(id) : saved.id;

      await qc.invalidateQueries({ queryKey: ["documentacion"] });
      await qc.invalidateQueries({ queryKey: ["documentacion", documentacionId] });
      await qc.invalidateQueries({
        queryKey: ["documentacion-historial", documentacionId],
      });

      navigate(`/documentacion/${documentacionId}`, {
        replace: true,
        state: {
          successMessage: isEdit
            ? "Documentacion actualizada con exito."
            : "Documentacion creada con exito.",
        },
      });
    },
    onError: (error) => {
      const defaultMessage = isEdit
        ? "No se pudo actualizar la documentacion."
        : "No se pudo crear la documentacion.";

      let backendMessage = defaultMessage;

      if (error instanceof HttpError) {
        const body = error.body as
          | { message?: string; error?: string; detalle?: string }
          | undefined;

        backendMessage =
          body?.error || body?.message || body?.detalle || defaultMessage;
      } else if (error instanceof Error) {
        backendMessage = error.message || defaultMessage;
      }

      setErrorMessage(backendMessage);
      setShowError(true);
    },
  });

  if (isLoading) return <p className="text-slate-500">Cargando...</p>;

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold leading-none md:text-3xl">
        {isEdit ? "Editar documentacion" : "Nueva documentacion"}
      </h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!validate()) return;
          if (!uct) return;
          await mutateAsync();
        }}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <Field label="Titulo">
          <>
            <input
              className={inputClass("titulo")}
              value={data.titulo}
              onChange={(e) => {
                setData((prev) => ({ ...prev, titulo: e.target.value }));
                if (e.target.value.trim()) clearError("titulo");
              }}
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-500">{errors.titulo}</p>
            )}
          </>
        </Field>

        <div>
          <AutoresField
            value={autores}
            options={autoresDisponibles}
            onChange={(updatedAutores) => {
              setAutores(updatedAutores);
              if (updatedAutores.length > 0) clearError("autores");
            }}
            label="Autores"
          />
          {errors.autores && (
            <p className="mt-1 text-sm text-red-500">{errors.autores}</p>
          )}
        </div>

        <Field label="Editorial">
          <>
            <input
              className={inputClass("editorial")}
              value={data.editorial}
              onChange={(e) => {
                setData((prev) => ({ ...prev, editorial: e.target.value }));
                if (e.target.value.trim()) clearError("editorial");
              }}
            />
            {errors.editorial && (
              <p className="mt-1 text-sm text-red-500">{errors.editorial}</p>
            )}
          </>
        </Field>

        <Field label="Fecha">
          <DatePicker
            value={data.fecha ? new Date(`${data.fecha}T00:00:00`) : null}
            onChange={(dt) => {
              setData((prev) => ({
                ...prev,
                fecha: dt ? dt.toISOString().split("T")[0] : "",
              }));
              if (dt) clearError("fecha");
            }}
            helperText={errors.fecha ?? "DD/MM/AAAA"}
            className={inputClass("fecha")}
          />
        </Field>

        <div className="flex justify-between pt-6">
          <Button type="button" variant="secondary" size="sm" onClick={() => navigate(-1)}>
            Volver
          </Button>

          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Guardando..." : isEdit ? "Actualizar" : "Guardar"}
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
