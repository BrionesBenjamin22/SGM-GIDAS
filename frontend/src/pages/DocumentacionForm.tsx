import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Button from "@/components/Button";
import AutoresField from "@/components/AutoresField";
import Field from "@/components/Field";
import { useDocumentacionForm } from "@/hooks/useDocumentacionForm";
import {
  getDocumentacionById,
  removeAutorFromDocumentacion,
} from "@/services/documentacionServices";
import { getAutores } from "@/services/autoresService";
import { useUctGuard } from "@/hooks/useUctGuard";

export default function DocumentacionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { uct, uctGuard } = useUctGuard();

  const { data: initial, isLoading } = useQuery({
    queryKey: ["documentacion", id],
    queryFn: () => (id ? getDocumentacionById(Number(id)) : null),
    enabled: Boolean(id),
  });

  const { data: autoresSistema = [] } = useQuery({
    queryKey: ["autores"],
    queryFn: getAutores,
  });

  const {
    data,
    setData,
    autores,
    setAutores,
    submit,
    isPending,
  } = useDocumentacionForm(initial ?? undefined);

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  if (isLoading) return <p>Cargando…</p>;

  const isEdit = Boolean(id);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const currentYear = new Date().getFullYear();

    if (!data.titulo.trim()) newErrors.titulo = "Debe ingresar título";

    if (!autores || autores.length === 0) {
      newErrors.autores = "Debe ingresar al menos un autor";
    }

    if (!data.editorial.trim()) {
      newErrors.editorial = "Debe ingresar editorial";
    }

    if (!data.anio) {
      newErrors.anio = "Debe ingresar un año";
    } else if (
      isNaN(data.anio) ||
      data.anio < 1800 ||
      data.anio > currentYear
    ) {
      newErrors.anio = `El año debe estar entre 1800 y ${currentYear}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        {isEdit ? "Editar documentación" : "Nueva documentación"}
      </h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!validate()) return;
          if (!uct) return;

          await submit(uct.id);

          if (isEdit) {
            navigate(`/documentacion/${id}`, {
              state: {
                successMessage: "Documentación actualizada con éxito!",
              },
            });
          } else {
            navigate("/documentacion", {
              state: {
                successMessage: "Documentación creada con éxito!",
              },
            });
          }
        }}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
      >
        <Field label="Título">
          <>
            <input
              className={inputClass("titulo")}
              value={data.titulo}
              onChange={(e) => {
                setData((d) => ({
                  ...d,
                  titulo: e.target.value,
                }));
                if (e.target.value.trim()) clearError("titulo");
              }}
            />
            {errors.titulo && (
              <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>
            )}
          </>
        </Field>

        <div>
        <AutoresField
          value={autores}
          options={autoresDisponibles}
          onChange={async (updatedAutores) => {
            const removed = autores.filter(
              (a) => !updatedAutores.some((u) => u.id === a.id)
            );

            if (isEdit && id && removed.length > 0) {
              for (const autor of removed) {
                await removeAutorFromDocumentacion(Number(id), autor.id);
              }
            }

            setAutores(updatedAutores);

            if (updatedAutores.length > 0) clearError("autores");
          }}
          label="Autores"
        />

          {errors.autores && (
            <p className="text-red-500 text-sm mt-1">{errors.autores}</p>
          )}
        </div>

        <Field label="Editorial">
          <>
            <input
              className={inputClass("editorial")}
              value={data.editorial}
              onChange={(e) => {
                setData((d) => ({
                  ...d,
                  editorial: e.target.value,
                }));
                if (e.target.value.trim()) clearError("editorial");
              }}
            />
            {errors.editorial && (
              <p className="text-red-500 text-sm mt-1">
                {errors.editorial}
              </p>
            )}
          </>
        </Field>

        <Field label="Año">
          <>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="Ej: 2024"
              className={inputClass("anio")}
              value={data.anio ?? ""}
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/\D/g, "");
                const limited = onlyNumbers.slice(0, 4);

                setData((d) => ({
                  ...d,
                  anio: limited ? Number(limited) : undefined,
                }));

                if (limited.length === 4) clearError("anio");
              }}
            />

            {errors.anio && (
              <p className="text-red-500 text-sm mt-1">{errors.anio}</p>
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

          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Guardando…" : isEdit ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>
      {uctGuard}
    </section>
  );
}