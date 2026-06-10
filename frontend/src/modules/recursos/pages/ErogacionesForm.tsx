import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import Button from "@/components/Button";
import DatePicker from "@/components/Calendar";
import Field from "@/components/Field";
import SuccessToast from "@/components/SuccessToast";
import { HttpError } from "@/lib/http";
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
    fecha: "",
    ingresos: "",
    egresos: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: erogacion, isLoading: loadingErogacion } = useQuery({
    queryKey: ["erogaciones", id],
    queryFn: () => getErogacionById(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!erogacion) return;

    setData({
      numeroErogacion: erogacion.numero_erogacion?.toString() ?? "",
      tipoErogacionId: erogacion.tipo_erogacion?.id?.toString() ?? "",
      fuenteFinanciamientoId: erogacion.fuente?.id?.toString() ?? "",
      fecha: erogacion.fecha ?? "",
      ingresos: erogacion.ingresos?.toString() ?? "",
      egresos: erogacion.egresos?.toString() ?? "",
    });
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

    if (!data.numeroErogacion) {
      newErrors.numero = "Debe ingresar numero de erogacion";
    }

    if (!data.tipoErogacionId) {
      newErrors.tipo = "Debe seleccionar tipo de erogacion";
    }

    if (!data.fuenteFinanciamientoId) {
      newErrors.fuente = "Debe seleccionar fuente de financiamiento";
    }

    if (!data.fecha) {
      newErrors.fecha = "Debe ingresar fecha";
    }

    if (data.ingresos === "" || Number(data.ingresos) < 0) {
      newErrors.ingresos = "Ingresos debe ser 0 o mayor";
    }

    if (data.egresos === "" || Number(data.egresos) < 0) {
      newErrors.egresos = "Egresos debe ser 0 o mayor";
    }

    if (
      data.ingresos !== "" &&
      data.egresos !== "" &&
      Number(data.ingresos) === 0 &&
      Number(data.egresos) === 0
    ) {
      newErrors.ingresos = "Ingresos y egresos no pueden ser ambos 0";
      newErrors.egresos = "Ingresos y egresos no pueden ser ambos 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: any) =>
      isEdit ? updateErogacion(Number(id), payload) : createErogacion(payload),
    onSuccess: async (saved) => {
      const erogacionId = isEdit ? Number(id) : saved.id;

      await qc.invalidateQueries({ queryKey: ["erogaciones"] });
      await qc.invalidateQueries({ queryKey: ["erogaciones", erogacionId] });
      await qc.invalidateQueries({
        queryKey: ["erogacion-historial", erogacionId],
      });

      navigate(`/erogaciones/${erogacionId}`, {
        replace: true,
        state: {
          successMessage: isEdit
            ? "Erogacion actualizada con exito."
            : "Erogacion creada con exito.",
        },
      });
    },
    onError: (error) => {
      const defaultMessage = isEdit
        ? "No se pudo actualizar la erogacion."
        : "No se pudo crear la erogacion.";

      let backendMessage = defaultMessage;

      if (error instanceof HttpError) {
        const body = error.body as
          | { message?: string; error?: string; detalle?: string }
          | undefined;

        backendMessage =
          body?.error || body?.message || body?.detalle || defaultMessage;

        const lowerMessage = backendMessage.toLowerCase();

        if (lowerMessage.includes("numero")) {
          setErrors((prev) => ({ ...prev, numero: backendMessage }));
        } else if (lowerMessage.includes("tipo")) {
          setErrors((prev) => ({ ...prev, tipo: backendMessage }));
        } else if (lowerMessage.includes("fuente")) {
          setErrors((prev) => ({ ...prev, fuente: backendMessage }));
        } else if (lowerMessage.includes("fecha")) {
          setErrors((prev) => ({ ...prev, fecha: backendMessage }));
        } else if (lowerMessage.includes("ingreso")) {
          setErrors((prev) => ({ ...prev, ingresos: backendMessage }));
        } else if (lowerMessage.includes("egreso")) {
          setErrors((prev) => ({ ...prev, egresos: backendMessage }));
        }
      }

      setErrorMessage(backendMessage);
      setShowError(true);
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uct) return;
    if (!validate()) return;

    const createPayload = {
      numero_erogacion: Number(data.numeroErogacion),
      tipo_erogacion_id: Number(data.tipoErogacionId),
      ingresos: Number(data.ingresos),
      egresos: Number(data.egresos),
      fuente_financiamiento_id: Number(data.fuenteFinanciamientoId),
      grupo_utn_id: uct.id,
      fecha: data.fecha,
    };

    if (!isEdit) {
      await mutateAsync(createPayload);
      return;
    }

    const initialPayload = {
      ingresos: erogacion?.ingresos ?? 0,
      egresos: erogacion?.egresos ?? 0,
    };

    const updatePayload = {
      ingresos: Number(data.ingresos),
      egresos: Number(data.egresos),
    };

    const changedPayload = Object.fromEntries(
      Object.entries(updatePayload).filter(([key, value]) => {
        return initialPayload[key as keyof typeof initialPayload] !== value;
      })
    );

    if (Object.keys(changedPayload).length === 0) {
      navigate(`/erogaciones/${id}`, {
        replace: true,
        state: {
          successMessage: "No hubo cambios para actualizar.",
        },
      });
      return;
    }

    await mutateAsync(changedPayload);
  };

  if (isEdit && loadingErogacion) {
    return <p className="text-slate-500">Cargando erogacion...</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold leading-none md:text-3xl">
        {isEdit ? "Editar erogacion" : "Nueva erogacion"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        {isEdit && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            En edicion, el backend solo permite actualizar ingresos y egresos.
          </div>
        )}

        <Field label="Numero de erogacion">
          <>
            <input
              type="number"
              className={inputClass("numero")}
              value={data.numeroErogacion}
              disabled={isEdit}
              placeholder="Ej: 125"
              onChange={(e) => {
                setData((prev) => ({
                  ...prev,
                  numeroErogacion: e.target.value,
                }));
                if (e.target.value) clearError("numero");
              }}
            />
            {errors.numero && (
              <p className="mt-1 text-sm text-red-500">{errors.numero}</p>
            )}
          </>
        </Field>

        <Field label="Tipo de erogacion">
          <>
            <select
              className={`${inputClass("tipo")} ${
                !data.tipoErogacionId ? "text-slate-400" : "text-slate-900"
              }`}
              value={data.tipoErogacionId}
              disabled={isEdit}
              onChange={(e) => {
                setData((prev) => ({
                  ...prev,
                  tipoErogacionId: e.target.value,
                }));
                if (e.target.value) clearError("tipo");
              }}
            >
              <option value="" disabled>
                Seleccionar tipo de erogacion
              </option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
            {errors.tipo && (
              <p className="mt-1 text-sm text-red-500">{errors.tipo}</p>
            )}
          </>
        </Field>

        <Field label="Fuente de financiamiento">
          <>
            <select
              className={`${inputClass("fuente")} ${
                !data.fuenteFinanciamientoId ? "text-slate-400" : "text-slate-900"
              }`}
              value={data.fuenteFinanciamientoId}
              disabled={isEdit}
              onChange={(e) => {
                setData((prev) => ({
                  ...prev,
                  fuenteFinanciamientoId: e.target.value,
                }));
                if (e.target.value) clearError("fuente");
              }}
            >
              <option value="" disabled>
                Seleccionar fuente de financiamiento
              </option>
              {fuentes.map((fuente) => (
                <option key={fuente.id} value={fuente.id}>
                  {fuente.nombre}
                </option>
              ))}
            </select>
            {errors.fuente && (
              <p className="mt-1 text-sm text-red-500">{errors.fuente}</p>
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
            disabled={isEdit}
          />
        </Field>

        <Field label="Ingresos">
          <>
            <input
              type="number"
              step="0.01"
              min={0}
              className={inputClass("ingresos")}
              value={data.ingresos}
              placeholder="Ej: 150000"
              onChange={(e) => {
                setData((prev) => ({
                  ...prev,
                  ingresos: e.target.value,
                }));
                clearError("ingresos");
              }}
            />
            {errors.ingresos && (
              <p className="mt-1 text-sm text-red-500">{errors.ingresos}</p>
            )}
          </>
        </Field>

        <Field label="Egresos">
          <>
            <input
              type="number"
              step="0.01"
              min={0}
              className={inputClass("egresos")}
              value={data.egresos}
              placeholder="Ej: 98500"
              onChange={(e) => {
                setData((prev) => ({
                  ...prev,
                  egresos: e.target.value,
                }));
                clearError("egresos");
              }}
            />
            {errors.egresos && (
              <p className="mt-1 text-sm text-red-500">{errors.egresos}</p>
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

          <Button type="submit" size="sm" disabled={isPending || !uct}>
            {isPending
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
