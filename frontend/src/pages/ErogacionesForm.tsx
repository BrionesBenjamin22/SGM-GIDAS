import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import Button from "@/components/Button";
import Field from "@/components/Field";
import {
  createErogacion,
  getErogacionById,
  updateErogacion,
} from "@/services/erogacionesServices";
import { useUctGuard } from "@/hooks/useUctGuard";
import { useTiposErogacion } from "@/hooks/useTipoErogacion";
import { useFuentesFinanciamiento } from "@/hooks/useFuenteFinanciamiento";

export default function ErogacionesForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { uct, uctGuard } = useUctGuard();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { tipos } = useTiposErogacion();
  const { fuentes } = useFuentesFinanciamiento();

  const [data, setData] = useState({
    numeroErogacion: "",
    tipoErogacionId: "",
    fuenteFinanciamientoId: "",
    ingresos: "",
    egresos: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: erogacion, isLoading: loadingErogacion } = useQuery({
    queryKey: ["erogaciones", id],
    queryFn: () => getErogacionById(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (erogacion) {
      setData({
        numeroErogacion: erogacion.numero_erogacion?.toString() ?? "",
        tipoErogacionId:
          erogacion.tipo_erogacion?.id?.toString() ?? "",
        fuenteFinanciamientoId:
          erogacion.fuente?.id?.toString() ?? "",
        ingresos: erogacion.ingresos?.toString() ?? "",
        egresos: erogacion.egresos?.toString() ?? "",
      });
    }
  }, [erogacion]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.numeroErogacion)
      newErrors.numero = "Debe ingresar número de erogación";

    if (!data.tipoErogacionId)
      newErrors.tipo = "Debe seleccionar tipo de erogación";

    if (data.ingresos && Number(data.ingresos) < 0)
      newErrors.ingresos = "Ingresos no puede ser negativo";

    if (data.egresos && Number(data.egresos) < 0)
      newErrors.egresos = "Egresos no puede ser negativo";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: any) =>
      isEdit
        ? updateErogacion(Number(id), payload)
        : createErogacion(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["erogaciones"] });
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uct) return;
    if (!validate()) return;

    await mutateAsync({
      numero_erogacion: Number(data.numeroErogacion),
      tipo_erogacion_id: Number(data.tipoErogacionId),
      ingresos: data.ingresos === "" ? 0 : Number(data.ingresos),
      egresos: data.egresos === "" ? 0 : Number(data.egresos),
      fuente_financiamiento_id: data.fuenteFinanciamientoId
        ? Number(data.fuenteFinanciamientoId)
        : undefined,
      grupo_utn_id: uct.id,
    });

    if (isEdit) {
      navigate(`/erogaciones/${id}`, {
        state: {
          successMessage: "Erogación actualizada con éxito!",
        },
      });
    } else {
      navigate("/erogaciones", {
        state: {
          successMessage: "Erogación creada con éxito!",
        },
      });
    }
  };

  if (isEdit && loadingErogacion)
    return <p className="text-slate-500">Cargando erogación…</p>;

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        {isEdit ? "Editar erogación" : "Nueva erogación"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
      >
        <Field label="Número de erogación">
          <>
            <input
              type="number"
              className={inputClass("numero")}
              value={data.numeroErogacion}
              placeholder="Ej: 125"
              onChange={(e) => {
                setData({ ...data, numeroErogacion: e.target.value });
                if (e.target.value) clearError("numero");
              }}
            />
            {errors.numero && (
              <p className="text-red-500 text-sm mt-1">
                {errors.numero}
              </p>
            )}
          </>
        </Field>

        <Field label="Tipo de erogación">
          <>
            <select
              className={`${inputClass("tipo")} ${
                !data.tipoErogacionId ? "text-slate-400" : "text-slate-900"
              }`}
              value={data.tipoErogacionId}
              onChange={(e) => {
                setData({ ...data, tipoErogacionId: e.target.value });
                if (e.target.value) clearError("tipo");
              }}
            >
              <option value="" disabled>
                Seleccionar tipo de erogación
              </option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
            {errors.tipo && (
              <p className="text-red-500 text-sm mt-1">
                {errors.tipo}
              </p>
            )}
          </>
        </Field>

        <Field label="Ingresos">
          <>
            <input
              type="number"
              className={inputClass("ingresos")}
              value={data.ingresos}
              placeholder="Ej: 150000"
              onChange={(e) => {
                setData({ ...data, ingresos: e.target.value });
                clearError("ingresos");
              }}
            />
            {errors.ingresos && (
              <p className="text-red-500 text-sm mt-1">
                {errors.ingresos}
              </p>
            )}
          </>
        </Field>

        <Field label="Egresos">
          <>
            <input
              type="number"
              className={inputClass("egresos")}
              value={data.egresos}
              placeholder="Ej: 98500"
              onChange={(e) => {
                setData({ ...data, egresos: e.target.value });
                clearError("egresos");
              }}
            />
            {errors.egresos && (
              <p className="text-red-500 text-sm mt-1">
                {errors.egresos}
              </p>
            )}
          </>
        </Field>

        <Field label="Fuente de financiamiento">
          <select
            className={`input ${
              !data.fuenteFinanciamientoId ? "text-slate-400" : "text-slate-900"
            }`}
            value={data.fuenteFinanciamientoId}
            onChange={(e) =>
              setData({
                ...data,
                fuenteFinanciamientoId: e.target.value,
              })
            }
          >
            <option value="">
              Seleccionar fuente de financiamiento
            </option>
            {fuentes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
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

          <Button
            type="submit"
            size="sm"
            disabled={isPending}
          >
            {isPending
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