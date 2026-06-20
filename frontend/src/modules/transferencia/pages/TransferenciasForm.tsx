import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import Button from "@/components/Button";
import DatePicker from "@/components/Calendar";
import Field from "@/components/Field";
import AdoptanteSelector from "@/components/AdoptanteSelector";
import SuccessToast from "@/components/SuccessToast";
import { HttpError } from "@/lib/http";
import {
  createTransferencia,
  getTransferenciaById,
  updateTransferencia,
  addAdoptantesToTransferencia,
  removeAdoptantesFromTransferencia,
  type Transferencia,
} from "@/modules/transferencia/services/transferenciasServices";
import type { Adoptante } from "@/modules/transferencia/services/adoptantesServices";
import { useUctGuard } from "@/modules/grupo/hooks/useUctGuard";
import { useTiposContrato } from "@/modules/transferencia/hooks/useTransferencias";

export default function TransferenciasForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { uct, uctGuard } = useUctGuard();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { tipos } = useTiposContrato();

  const [data, setData] = useState({
    numeroTransferencia: "",
    denominacion: "",
    demandante: "",
    descripcionActividad: "",
    monto: "",
    fechaInicio: "",
    fechaFin: "",
    tipoContratoId: "",
  });
  const [adoptantes, setAdoptantes] = useState<Adoptante[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: transferencia, isLoading } = useQuery<Transferencia | null>({
    queryKey: ["transferencias", id],
    queryFn: () => getTransferenciaById(Number(id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!transferencia) return;

    setData({
      numeroTransferencia: transferencia.numeroTransferencia?.toString() ?? "",
      denominacion: transferencia.denominacion ?? "",
      demandante: transferencia.demandante ?? "",
      descripcionActividad: transferencia.descripcionActividad ?? "",
      monto: transferencia.monto?.toString() ?? "",
      fechaInicio: transferencia.fechaInicio ?? "",
      fechaFin: transferencia.fechaFin ?? "",
      tipoContratoId: transferencia.tipoContratoId?.toString() ?? "",
    });
    setAdoptantes(transferencia.adoptantes ?? []);
  }, [transferencia]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.numeroTransferencia || Number(data.numeroTransferencia) <= 0) {
      newErrors.numeroTransferencia = "Debe ingresar un numero positivo";
    }

    if (!data.denominacion.trim() || data.denominacion.trim().length < 3) {
      newErrors.denominacion = "Debe ingresar una denominacion valida";
    }

    if (!data.demandante.trim() || data.demandante.trim().length < 3) {
      newErrors.demandante = "Debe ingresar un demandante valido";
    }

    if (!data.descripcionActividad.trim() || data.descripcionActividad.trim().length < 10) {
      newErrors.descripcionActividad =
        "La descripcion debe tener al menos 10 caracteres";
    }

    if (!data.monto || Number(data.monto) <= 0) {
      newErrors.monto = "El monto debe ser mayor a 0";
    }

    if (!data.fechaInicio) {
      newErrors.fechaInicio = "Debe ingresar fecha de inicio";
    }

    if (data.fechaInicio && data.fechaFin && data.fechaFin < data.fechaInicio) {
      newErrors.fechaFin = "La fecha de fin no puede ser anterior a la de inicio";
    }

    if (!data.tipoContratoId) {
      newErrors.tipoContratoId = "Debe seleccionar tipo de contrato";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!uct) {
        throw new Error("Grupo no disponible");
      }

      const payload = {
        numeroTransferencia: Number(data.numeroTransferencia),
        denominacion: data.denominacion.trim(),
        demandante: data.demandante.trim(),
        descripcionActividad: data.descripcionActividad.trim(),
        monto: Number(data.monto),
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin || undefined,
        tipoContratoId: Number(data.tipoContratoId),
        grupoUtnId: uct.id,
      };

      if (!isEdit) {
        const created = await createTransferencia({
          ...payload,
          adoptantesIds: adoptantes.map((adoptante) => adoptante.id),
        });
        return created;
      }

      const initialPayload = {
        numeroTransferencia: transferencia?.numeroTransferencia ?? 0,
        denominacion: transferencia?.denominacion ?? "",
        demandante: transferencia?.demandante ?? "",
        descripcionActividad: transferencia?.descripcionActividad ?? "",
        monto: transferencia?.monto ?? 0,
        fechaInicio: transferencia?.fechaInicio ?? "",
        fechaFin: transferencia?.fechaFin ?? undefined,
        tipoContratoId: transferencia?.tipoContratoId ?? 0,
        grupoUtnId: transferencia?.grupoUtnId ?? uct.id,
      };

      const changedPayload = Object.fromEntries(
        Object.entries(payload).filter(([key, value]) => {
          return initialPayload[key as keyof typeof initialPayload] !== value;
        })
      );

      const prevIds = transferencia?.adoptantes.map((adoptante) => adoptante.id) ?? [];
      const nextIds = adoptantes.map((adoptante) => adoptante.id);
      const toAdd = nextIds.filter((adoptanteId) => !prevIds.includes(adoptanteId));
      const toRemove = prevIds.filter((adoptanteId) => !nextIds.includes(adoptanteId));

      if (
        Object.keys(changedPayload).length === 0 &&
        toAdd.length === 0 &&
        toRemove.length === 0
      ) {
        navigate(`/transferencias/${id}`, {
          replace: true,
          state: {
            successMessage: "No hubo cambios para actualizar.",
          },
        });
        return null;
      }

      let updated = transferencia;
      if (Object.keys(changedPayload).length > 0) {
        updated = await updateTransferencia(Number(id), changedPayload);
      }

      if (toAdd.length > 0) {
        await addAdoptantesToTransferencia(Number(id), toAdd);
      }

      if (toRemove.length > 0) {
        await removeAdoptantesFromTransferencia(Number(id), toRemove);
      }

      return updated ?? transferencia ?? null;
    },
    onSuccess: async (saved) => {
      if (!saved) return;

      const transferenciaId = isEdit ? Number(id) : saved.id;

      await qc.invalidateQueries({ queryKey: ["transferencias"] });
      await qc.invalidateQueries({ queryKey: ["transferencias", transferenciaId] });
      await qc.invalidateQueries({
        queryKey: ["transferencia-historial", transferenciaId],
      });

      navigate(`/transferencias/${transferenciaId}`, {
        replace: true,
        state: {
          successMessage: isEdit
            ? "Transferencia actualizada con exito."
            : "Transferencia creada con exito.",
        },
      });
    },
    onError: (error) => {
      const defaultMessage = isEdit
        ? "No se pudo actualizar la transferencia."
        : "No se pudo crear la transferencia.";

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

  if (isEdit && isLoading) {
    return <p className="text-slate-500">Cargando transferencia...</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold leading-none md:text-3xl">
        {isEdit ? "Editar transferencia" : "Nueva transferencia"}
      </h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!uct) return;
          if (!validate()) return;
          await mutateAsync();
        }}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <Field label="Numero de transferencia">
          <>
            <input
              type="number"
              className={inputClass("numeroTransferencia")}
              value={data.numeroTransferencia}
              placeholder="Ej: 2025001"
              onChange={(e) => {
                setData((prev) => ({ ...prev, numeroTransferencia: e.target.value }));
                if (e.target.value) clearError("numeroTransferencia");
              }}
            />
            {errors.numeroTransferencia && (
              <p className="mt-1 text-sm text-red-500">{errors.numeroTransferencia}</p>
            )}
          </>
        </Field>

        <Field label="Denominacion">
          <>
            <input
              className={inputClass("denominacion")}
              value={data.denominacion}
              placeholder="Ej: Convenio de asistencia tecnica"
              onChange={(e) => {
                setData((prev) => ({ ...prev, denominacion: e.target.value }));
                if (e.target.value.trim()) clearError("denominacion");
              }}
            />
            {errors.denominacion && (
              <p className="mt-1 text-sm text-red-500">{errors.denominacion}</p>
            )}
          </>
        </Field>

        <Field label="Demandante">
          <>
            <input
              className={inputClass("demandante")}
              value={data.demandante}
              placeholder="Ej: Municipalidad de Resistencia"
              onChange={(e) => {
                setData((prev) => ({ ...prev, demandante: e.target.value }));
                if (e.target.value.trim()) clearError("demandante");
              }}
            />
            {errors.demandante && (
              <p className="mt-1 text-sm text-red-500">{errors.demandante}</p>
            )}
          </>
        </Field>

        <Field label="Descripcion de la actividad">
          <>
            <textarea
              rows={5}
              className={inputClass("descripcionActividad")}
              value={data.descripcionActividad}
              placeholder="Describir brevemente la actividad desarrollada"
              onChange={(e) => {
                setData((prev) => ({
                  ...prev,
                  descripcionActividad: e.target.value,
                }));
                if (e.target.value.trim()) clearError("descripcionActividad");
              }}
            />
            {errors.descripcionActividad && (
              <p className="mt-1 text-sm text-red-500">{errors.descripcionActividad}</p>
            )}
          </>
        </Field>

        <Field label="Monto">
          <>
            <input
              type="number"
              step="0.01"
              min={0}
              className={inputClass("monto")}
              value={data.monto}
              placeholder="Ej: 250000"
              onChange={(e) => {
                setData((prev) => ({ ...prev, monto: e.target.value }));
                if (e.target.value) clearError("monto");
              }}
            />
            {errors.monto && <p className="mt-1 text-sm text-red-500">{errors.monto}</p>}
          </>
        </Field>

        <Field label="Fecha de inicio">
          <DatePicker
            value={data.fechaInicio ? new Date(`${data.fechaInicio}T00:00:00`) : null}
            onChange={(dt) => {
              setData((prev) => ({
                ...prev,
                fechaInicio: dt ? dt.toISOString().split("T")[0] : "",
              }));
              if (dt) clearError("fechaInicio");
            }}
            helperText={errors.fechaInicio ?? "DD/MM/AAAA"}
            className={inputClass("fechaInicio")}
          />
        </Field>

        <Field label="Fecha de fin">
          <DatePicker
            value={data.fechaFin ? new Date(`${data.fechaFin}T00:00:00`) : null}
            onChange={(dt) => {
              setData((prev) => ({
                ...prev,
                fechaFin: dt ? dt.toISOString().split("T")[0] : "",
              }));
              clearError("fechaFin");
            }}
            helperText={errors.fechaFin ?? "Opcional"}
            className={inputClass("fechaFin")}
          />
        </Field>

        <Field label="Tipo de contrato">
          <>
            <select
              className={`${inputClass("tipoContratoId")} ${
                !data.tipoContratoId ? "text-slate-400" : "text-slate-900"
              }`}
              value={data.tipoContratoId}
              onChange={(e) => {
                setData((prev) => ({ ...prev, tipoContratoId: e.target.value }));
                if (e.target.value) clearError("tipoContratoId");
              }}
            >
              <option value="" disabled>
                Seleccionar tipo de contrato
              </option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
            {errors.tipoContratoId && (
              <p className="mt-1 text-sm text-red-500">{errors.tipoContratoId}</p>
            )}
          </>
        </Field>

        <AdoptanteSelector selected={adoptantes} onChange={setAdoptantes} />

        <div className="flex justify-between pt-6">
          <Button type="button" variant="secondary" size="sm" onClick={() => navigate(-1)}>
            Volver
          </Button>

          <Button type="submit" size="sm" disabled={isPending || !uct}>
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
