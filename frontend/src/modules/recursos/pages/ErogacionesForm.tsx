import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Button";
import DatePicker from "@/components/Calendar";
import Field from "@/components/Field";
import SuccessToast from "@/components/SuccessToast";
import { useAuth } from "@/context/AuthContext";
import { HttpError } from "@/lib/http";
import { applyFieldErrors, getApiFieldErrors, getErrorMessage } from "@/lib/httpError";
import { useFuentesFinanciamiento } from "@/modules/catalogos/hooks/useFuenteFinanciamiento";
import { useUctGuard } from "@/modules/grupo/hooks/useUctGuard";
import { useCategoriasErogacion } from "@/modules/recursos/hooks/useCategoriasErogacion";
import {
  createErogacion, getErogacionById, getResumenFinanciero, updateErogacion,
  type CreateErogacionPayload, type TipoMovimiento, type UpdateErogacionPayload,
} from "@/modules/recursos/services/erogacionesServices";
import DraftLeaveControls from "@/modules/shared/components/DraftLeaveControls";
import DraftRecoveryNotice from "@/modules/shared/components/DraftRecoveryNotice";
import { useFormDraft } from "@/modules/shared/hooks/useFormDraft";
import { formatMovimientoMoney } from "@/modules/recursos/utils/movimientoHistory";
import { excedeSaldoDisponible } from "@/modules/recursos/utils/movimientoSaldo";
import { toCivilDateString } from "@/utils/dateTime";

type FormData = {
  tipo_movimiento: TipoMovimiento | "";
  fecha: string;
  monto: string;
  fuente_financiamiento_id: string;
  categoria_erogacion_id: string;
};

const emptyData: FormData = {
  tipo_movimiento: "", fecha: "", monto: "",
  fuente_financiamiento_id: "", categoria_erogacion_id: "",
};

function normalizarMonto(value: string): string {
  const [entero, decimales = ""] = value.trim().split(".");
  return `${BigInt(entero)}.${decimales.padEnd(2, "0")}`;
}

export default function ErogacionesForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { uct, uctGuard } = useUctGuard();
  const { user } = useAuth();
  const { fuentes } = useFuentesFinanciamiento();
  const { data: categorias = [] } = useCategoriasErogacion();
  const { data: movimiento, isLoading: loadingMovimiento, refetch: refetchMovimiento } = useQuery({
    queryKey: ["erogaciones", id],
    queryFn: () => getErogacionById(Number(id)),
    enabled: isEdit,
  });
  const [data, setData] = useState<FormData>(emptyData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [checkingSaldo, setCheckingSaldo] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState<string | null>(null);
  const balanceDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = balanceDialog.current;
    if (!dialog) return;
    if (insufficientBalance !== null && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLButtonElement>("button")?.focus();
    } else if (insufficientBalance === null && dialog.open) {
      dialog.close();
    }
  }, [insufficientBalance]);

  useEffect(() => {
    if (!movimiento) return;
    setData({
      tipo_movimiento: movimiento.tipo_movimiento,
      fecha: movimiento.fecha,
      monto: movimiento.monto,
      fuente_financiamiento_id: movimiento.fuente_financiamiento_id?.toString() ?? "",
      categoria_erogacion_id: movimiento.categoria_erogacion_id?.toString() ?? "",
    });
  }, [movimiento]);

  const {
    availableDraft, sourceChanged, restoreDraft, discardDraft, clearDraft,
    saveStatus, blocker, requestLeave, keepAndLeave, discardAndLeave,
  } = useFormDraft({
    userId: user?.id,
    module: "recursos-erogaciones",
    recordId: id,
    value: data,
    ready: !isEdit || (!loadingMovimiento && Boolean(movimiento)),
    autosave: false,
    hasContent: (draft) => Object.values(draft).some((value) => value.trim() !== ""),
    onRestore: setData,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: CreateErogacionPayload | UpdateErogacionPayload) =>
      isEdit
        ? updateErogacion(Number(id), payload as UpdateErogacionPayload)
        : createErogacion(payload as CreateErogacionPayload),
    onSuccess: async (saved) => {
      clearDraft();
      await qc.invalidateQueries({ queryKey: ["erogaciones"] });
      await qc.invalidateQueries({ queryKey: ["resumen-financiero"] });
      await qc.invalidateQueries({ queryKey: ["erogacion-historial", saved.id] });
      await qc.invalidateQueries({ queryKey: ["movimiento-financiero-historial", saved.id] });
      navigate(isEdit ? `/movimientos/${saved.id}` : "/movimientos", {
        replace: true,
        state: { successMessage: isEdit
          ? "Movimiento actualizado con éxito."
          : "Movimiento creado con éxito." },
      });
    },
    onError: async (error) => {
      if (data.tipo_movimiento === "EGRESO" && error instanceof HttpError &&
          error.status === 409 && getApiFieldErrors(error).monto && uct) {
        try {
          const resumen = await getResumenFinanciero(uct.id);
          qc.setQueryData(["resumen-financiero", uct.id], resumen);
          setInsufficientBalance(resumen.saldo_disponible);
        } catch {
          setErrorMessage("Lo sentimos, no pudimos consultar el saldo disponible. Intente nuevamente.");
        }
        return;
      }
      if (applyFieldErrors(error, setErrors, [
        "tipo_movimiento", "fecha", "monto", "fuente_financiamiento_id", "categoria_erogacion_id",
      ])) return;
      setErrorMessage(getErrorMessage(
        error,
        "Lo sentimos, no pudimos guardar el movimiento. Verifique los datos e intente nuevamente.",
      ));
    },
  });

  const setField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isPending || checkingSaldo || !uct) return;
    const nextErrors: Record<string, string> = {};
    if (data.tipo_movimiento !== "INGRESO" && data.tipo_movimiento !== "EGRESO") nextErrors.tipo_movimiento = "Seleccione ingreso o egreso.";
    if (!data.fecha) nextErrors.fecha = "Seleccione la fecha del movimiento.";
    if (!/^\d{1,16}(\.\d{1,2})?$/.test(data.monto.trim()) || Number(data.monto) <= 0) {
      nextErrors.monto = "Ingrese un monto mayor que cero, con hasta dos decimales.";
    }
    if (data.tipo_movimiento === "INGRESO" && !data.fuente_financiamiento_id) {
      nextErrors.fuente_financiamiento_id = "Seleccione la fuente de financiamiento.";
    }
    if (data.tipo_movimiento === "EGRESO" && !data.categoria_erogacion_id) {
      nextErrors.categoria_erogacion_id = "Seleccione la categoría de erogación.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setErrorMessage("");

    const monto = normalizarMonto(data.monto);
    let payload: CreateErogacionPayload | UpdateErogacionPayload;
    if (!isEdit) {
      payload = {
        tipo_movimiento: data.tipo_movimiento as TipoMovimiento,
        monto, fecha: data.fecha, grupo_utn_id: uct.id,
        ...(data.tipo_movimiento === "INGRESO"
          ? { fuente_financiamiento_id: Number(data.fuente_financiamiento_id) }
          : { categoria_erogacion_id: Number(data.categoria_erogacion_id) }),
      };
    } else {
      if (!movimiento) return;
      const changes: UpdateErogacionPayload = {};
      if (data.fecha !== movimiento.fecha) changes.fecha = data.fecha;
      if (monto !== normalizarMonto(movimiento.monto)) changes.monto = monto;
      if (data.tipo_movimiento === "INGRESO" &&
          Number(data.fuente_financiamiento_id) !== movimiento.fuente_financiamiento_id) {
        changes.fuente_financiamiento_id = Number(data.fuente_financiamiento_id);
      }
      if (data.tipo_movimiento === "EGRESO" &&
          Number(data.categoria_erogacion_id) !== movimiento.categoria_erogacion_id) {
        changes.categoria_erogacion_id = Number(data.categoria_erogacion_id);
      }
      if (!Object.keys(changes).length) {
        clearDraft();
        navigate(`/movimientos/${id}`, {
          replace: true, state: { successMessage: "No hubo cambios para actualizar." },
        });
        return;
      }
      payload = changes;
    }

    if (data.tipo_movimiento === "EGRESO") {
      setCheckingSaldo(true);
      try {
        const resumen = await getResumenFinanciero(uct.id);
        qc.setQueryData(["resumen-financiero", uct.id], resumen);
        const montoAnterior = isEdit && movimiento ? movimiento.monto : "0.00";
        if (excedeSaldoDisponible(monto, resumen.saldo_disponible, montoAnterior)) {
          setInsufficientBalance(resumen.saldo_disponible);
          return;
        }
      } catch {
        setErrorMessage("Lo sentimos, no pudimos consultar el saldo disponible. Intente nuevamente.");
        return;
      } finally {
        setCheckingSaldo(false);
      }
    }
    try {
      await mutateAsync(payload);
    } catch {
      // El callback onError presenta el error del backend o actualiza el saldo del diálogo.
    }
  };

  if (isEdit && loadingMovimiento) return <p className="text-slate-500">Cargando movimiento...</p>;
  if (isEdit && !movimiento) return <div role="alert" className="flex items-center gap-3 text-slate-600">Lo sentimos, no pudimos recuperar el movimiento. Intente nuevamente.<Button size="sm" variant="secondary" onClick={() => refetchMovimiento()}>Reintentar</Button></div>;

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold leading-none md:text-3xl">
        {isEdit ? "Editar movimiento" : "Nuevo movimiento"}
      </h2>
      {availableDraft && <DraftRecoveryNotice savedAt={availableDraft.saved_at} sourceChanged={sourceChanged} onRestore={restoreDraft} onDiscard={discardDraft} />}
      <DraftLeaveControls blocker={blocker} saveStatus={saveStatus} keepAndLeave={keepAndLeave} discardAndLeave={discardAndLeave} />
      <form noValidate onSubmit={submit} className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
        {isEdit && movimiento && <p className="text-sm text-slate-600">Movimiento N.º {String(movimiento.numero_movimiento).padStart(6, "0")}</p>}
        <Field required label="Tipo de movimiento" name="tipo_movimiento" error={errors.tipo_movimiento}>
          {isEdit ? <p className="rounded-lg border border-slate-200 bg-slate-50 p-2">{data.tipo_movimiento === "INGRESO" ? "Ingreso" : "Egreso"}</p> : (
            <select className="input" value={data.tipo_movimiento} onChange={(event) => {
              setData((previous) => ({ ...previous, tipo_movimiento: event.target.value as TipoMovimiento, fuente_financiamiento_id: "", categoria_erogacion_id: "" }));
              setErrors({});
            }}>
              <option value="">Seleccione el tipo</option>
              <option value="INGRESO">Ingreso</option>
              <option value="EGRESO">Egreso</option>
            </select>
          )}
        </Field>
        <Field required label="Fecha" name="fecha" error={errors.fecha}>
          <DatePicker value={data.fecha ? new Date(`${data.fecha}T00:00:00`) : null} maxDate={new Date()} onChange={(date) => setField("fecha", toCivilDateString(date) ?? "")} helperText="DD/MM/AAAA" />
        </Field>
        <Field required label="Monto" name="monto" error={errors.monto}>
          <input type="number" min="0.01" step="0.01" className="input" value={data.monto} placeholder="Ej.: 150000.00" onChange={(event) => setField("monto", event.target.value)} />
        </Field>
        <Field label="Moneda" name="moneda"><p className="rounded-lg border border-slate-200 bg-slate-50 p-2">ARS</p></Field>
        {data.tipo_movimiento === "INGRESO" && (
          <Field required label="Fuente de financiamiento" name="fuente_financiamiento_id" error={errors.fuente_financiamiento_id}>
            <select className="input" value={data.fuente_financiamiento_id} onChange={(event) => setField("fuente_financiamiento_id", event.target.value)}>
              <option value="">Seleccione una fuente</option>
              {fuentes.map((fuente) => <option key={fuente.id} value={fuente.id}>{fuente.nombre}</option>)}
            </select>
          </Field>
        )}
        {data.tipo_movimiento === "EGRESO" && (
          <Field required label="Categoría de erogación" name="categoria_erogacion_id" error={errors.categoria_erogacion_id}>
            <select className="input" value={data.categoria_erogacion_id} onChange={(event) => setField("categoria_erogacion_id", event.target.value)}>
              <option value="">Seleccione una categoría</option>
              {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
            </select>
          </Field>
        )}
        <div className="flex justify-between pt-6">
          <Button type="button" variant="secondary" size="sm" onClick={() => requestLeave(() => navigate(-1))}>Volver</Button>
          <Button type="submit" size="sm" disabled={isPending || checkingSaldo || !uct} loading={isPending || checkingSaldo} loadingText={checkingSaldo ? "Consultando saldo..." : "Guardando..."}>{isEdit ? "Actualizar" : "Guardar"}</Button>
        </div>
      </form>
      <SuccessToast open={Boolean(errorMessage)} message={errorMessage} onClose={() => setErrorMessage("")} variant="error" />
      <dialog ref={balanceDialog} aria-labelledby="saldo-insuficiente-title" aria-describedby="saldo-insuficiente-description" onCancel={() => setInsufficientBalance(null)} onClose={() => setInsufficientBalance(null)} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-slate-950/50">
        <h3 id="saldo-insuficiente-title" className="text-xl font-semibold text-slate-900">Saldo Insuficiente</h3>
        <p id="saldo-insuficiente-description" className="mt-3 text-sm text-slate-600">El egreso supera el saldo disponible al momento. Revise el monto e intente nuevamente.</p>
        <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">Saldo disponible: <strong className="block text-lg text-slate-900">{insufficientBalance === null ? "" : formatMovimientoMoney(insufficientBalance)}</strong></p>
        <div className="mt-6 flex justify-end"><Button type="button" size="sm" onClick={() => setInsufficientBalance(null)}>Aceptar</Button></div>
      </dialog>
      {uctGuard}
    </section>
  );
}
