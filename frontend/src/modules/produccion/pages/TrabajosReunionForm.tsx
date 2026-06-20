import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import PersonalProyectoField from "@/components/PersonalProyectoField";
import Field from "@/components/Field";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";

import { HttpError } from "@/lib/http";
import { toTitleCase } from "@/utils/format";

import {
  createTrabajoReunion,
  updateTrabajoReunion,
  getTrabajoReunionById,
  vincularInvestigadoresTrabajo,
  desvincularInvestigadoresTrabajo,
} from "@/modules/produccion/services/trabajosReunionServices";

import { useTiposReunion } from "@/modules/produccion/hooks/useTiposReunion";
import { useInvestigadores } from "@/modules/personal/hooks/useInvestigadores";
import { useUctGuard } from "@/modules/grupo/hooks/useUctGuard";

export default function TrabajoReunionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = Boolean(id);

  const { uct, uctGuard } = useUctGuard();
  const { tipos = [] } = useTiposReunion();
  const { data: investigadores = [] } = useInvestigadores();

  const { data: initialData, isLoading } = useQuery({
    queryKey: ["trabajo-reunion", id],
    queryFn: () => (id ? getTrabajoReunionById(Number(id)) : Promise.resolve(null)),
    enabled: isEdit,
  });

  const [titulo, setTitulo] = useState("");
  const [nombreReunion, setNombreReunion] = useState("");
  const [procedencia, setProcedencia] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [tipoId, setTipoId] = useState<number | null>(null);
  const [investigadoresIds, setInvestigadoresIds] = useState<number[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [investigadorAEliminar, setInvestigadorAEliminar] =
    useState<{ id: number; nombre: string } | null>(null);

  useEffect(() => {
    if (!initialData) return;

    setTitulo(initialData.titulo_trabajo ?? "");
    setNombreReunion(initialData.nombre_reunion ?? "");
    setProcedencia(initialData.procedencia ?? "");
    setFechaInicio(
      initialData.fecha_inicio ? new Date(`${initialData.fecha_inicio}T00:00:00`) : null
    );
    setTipoId(initialData.tipo_reunion?.id ?? null);
    setInvestigadoresIds(
      initialData.investigadores?.map((i: { id: number }) => i.id) ?? []
    );
  }, [initialData]);

  const formatDateStr = (date: Date | null) => {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

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
    }

    if (!nombreReunion.trim()) {
      newErrors.nombreReunion = "Debe ingresar nombre de reunion";
    }

    if (!procedencia.trim()) {
      newErrors.procedencia = "Debe ingresar procedencia";
    }

    if (!tipoId) {
      newErrors.tipoId = "Debe seleccionar tipo de reunion";
    }

    if (!fechaInicio) {
      newErrors.fechaInicio = "Debe seleccionar fecha";
    }

    if (investigadoresIds.length === 0) {
      newErrors.investigadores = "Debe agregar al menos un investigador";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const currentInvestigadoresIds =
        initialData?.investigadores?.map((i: { id: number }) => i.id) ?? [];
      const nuevosInvestigadoresIds = isEdit
        ? investigadoresIds.filter((investigadorId) => !currentInvestigadoresIds.includes(investigadorId))
        : investigadoresIds;

      let trabajo = initialData;

      if (!isEdit) {
        trabajo = await createTrabajoReunion(payload);
      } else if (!payload._skipUpdate) {
        trabajo = await updateTrabajoReunion(Number(id), payload);
      }

      const trabajoId = trabajo?.id;

      if (trabajoId && nuevosInvestigadoresIds.length > 0) {
        await vincularInvestigadoresTrabajo(trabajoId, nuevosInvestigadoresIds);
      }

      return trabajo;
    },
    onSuccess: async (saved: any) => {
      const trabajoId = saved?.id ?? Number(id);

      await qc.invalidateQueries({ queryKey: ["trabajos-reunion"] });
      await qc.invalidateQueries({ queryKey: ["trabajo-reunion", trabajoId] });
      await qc.invalidateQueries({ queryKey: ["trabajo-reunion-historial", trabajoId] });

      navigate(`/trabajos-reunion/${trabajoId}`, {
        replace: true,
        state: {
          successMessage: isEdit
            ? "Trabajo actualizado con exito."
            : "Trabajo creado con exito.",
        },
      });
    },
    onError: (error) => {
      const defaultMessage = isEdit
        ? "No se pudo actualizar el trabajo en reunion cientifica."
        : "No se pudo crear el trabajo en reunion cientifica.";

      let backendMessage = defaultMessage;

      if (error instanceof HttpError && error.body && typeof error.body === "object") {
        const body = error.body as Record<string, unknown>;
        backendMessage =
          typeof body.error === "string"
            ? body.error
            : typeof body.message === "string"
              ? body.message
              : typeof body.detalle === "string"
                ? body.detalle
                : defaultMessage;

        const lowerMessage = backendMessage.toLowerCase();

        if (lowerMessage.includes("titulo")) {
          setErrors((prev) => ({ ...prev, titulo: backendMessage }));
        } else if (lowerMessage.includes("reunion")) {
          setErrors((prev) => ({ ...prev, nombreReunion: backendMessage }));
        } else if (lowerMessage.includes("procedencia")) {
          setErrors((prev) => ({ ...prev, procedencia: backendMessage }));
        } else if (lowerMessage.includes("tipo")) {
          setErrors((prev) => ({ ...prev, tipoId: backendMessage }));
        } else if (lowerMessage.includes("fecha")) {
          setErrors((prev) => ({ ...prev, fechaInicio: backendMessage }));
        }
      }

      setErrorMessage(backendMessage);
      setShowError(true);
    },
  });

  const desvincularMutation = useMutation({
    mutationFn: async (investigadorId: number) => {
      return desvincularInvestigadoresTrabajo(Number(id), [investigadorId]);
    },
    onSuccess: async (_, investigadorId) => {
      setInvestigadoresIds((prev) => prev.filter((i) => i !== investigadorId));
      setInvestigadorAEliminar(null);

      await qc.invalidateQueries({ queryKey: ["trabajo-reunion", Number(id)] });
      await qc.invalidateQueries({ queryKey: ["trabajo-reunion-historial", Number(id)] });

      setSuccessMessage("Investigador desvinculado con exito.");
      setShowSuccess(true);
    },
    onError: (error) => {
      let message = "No se pudo desvincular el investigador.";

      if (error instanceof HttpError && error.body && typeof error.body === "object") {
        const body = error.body as Record<string, unknown>;
        message =
          typeof body.error === "string"
            ? body.error
            : typeof body.message === "string"
              ? body.message
              : typeof body.detalle === "string"
                ? body.detalle
                : message;
      }

      setInvestigadorAEliminar(null);
      setErrorMessage(message);
      setShowError(true);
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uct) return;
    if (!validate()) return;

    const payload = {
      titulo_trabajo: toTitleCase(titulo.trim()),
      nombre_reunion: toTitleCase(nombreReunion.trim()),
      procedencia: toTitleCase(procedencia.trim()),
      fecha_inicio: formatDateStr(fechaInicio)!,
      tipo_reunion_id: tipoId!,
      grupo_utn_id: uct.id,
    };

    if (!isEdit) {
      await mutation.mutateAsync(payload);
      return;
    }

    const initialPayload = {
      titulo_trabajo: initialData?.titulo_trabajo ?? "",
      nombre_reunion: initialData?.nombre_reunion ?? "",
      procedencia: initialData?.procedencia ?? "",
      fecha_inicio: initialData?.fecha_inicio ?? null,
      tipo_reunion_id: initialData?.tipo_reunion?.id ?? null,
      grupo_utn_id: uct.id,
    };

    const changedPayload = Object.fromEntries(
      Object.entries(payload).filter(([key, value]) => {
        return initialPayload[key as keyof typeof initialPayload] !== value;
      })
    );

    const currentInvestigadoresIds =
      initialData?.investigadores?.map((i: { id: number }) => i.id) ?? [];
    const nuevosInvestigadoresIds = investigadoresIds.filter(
      (investigadorId) => !currentInvestigadoresIds.includes(investigadorId)
    );

    if (Object.keys(changedPayload).length === 0 && nuevosInvestigadoresIds.length === 0) {
      navigate(`/trabajos-reunion/${id}`, {
        replace: true,
        state: {
          successMessage: "No hubo cambios para actualizar.",
        },
      });
      return;
    }

    await mutation.mutateAsync({
      ...changedPayload,
      _skipUpdate: Object.keys(changedPayload).length === 0,
    });
  };

  if (isEdit && isLoading) {
    return <p className="text-slate-500">Cargando trabajo...</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold leading-none md:text-3xl">
        {isEdit ? "Editar trabajo" : "Nuevo trabajo"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <Field label="Titulo del trabajo">
          <>
            <input
              className={inputClass("titulo")}
              value={titulo}
              placeholder="Ej: Aplicacion de modelos predictivos en sistemas complejos"
              onChange={(e) => {
                setTitulo(e.target.value);
                if (e.target.value.trim()) clearError("titulo");
              }}
              onBlur={() => {
                if (titulo.trim()) setTitulo(toTitleCase(titulo));
              }}
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-500">{errors.titulo}</p>
            )}
          </>
        </Field>

        <Field label="Nombre de la reunion">
          <>
            <input
              className={inputClass("nombreReunion")}
              value={nombreReunion}
              placeholder="Ej: Congreso Argentino de Ingenieria"
              onChange={(e) => {
                setNombreReunion(e.target.value);
                if (e.target.value.trim()) clearError("nombreReunion");
              }}
              onBlur={() => {
                if (nombreReunion.trim()) {
                  setNombreReunion(toTitleCase(nombreReunion));
                }
              }}
            />
            {errors.nombreReunion && (
              <p className="mt-1 text-sm text-red-500">{errors.nombreReunion}</p>
            )}
          </>
        </Field>

        <Field label="Procedencia">
          <>
            <input
              className={inputClass("procedencia")}
              value={procedencia}
              placeholder="Ej: Argentina"
              onChange={(e) => {
                setProcedencia(e.target.value);
                if (e.target.value.trim()) clearError("procedencia");
              }}
              onBlur={() => {
                if (procedencia.trim()) {
                  setProcedencia(toTitleCase(procedencia));
                }
              }}
            />
            {errors.procedencia && (
              <p className="mt-1 text-sm text-red-500">{errors.procedencia}</p>
            )}
          </>
        </Field>

        <Field label="Tipo de reunion">
          <>
            <select
              className={`${inputClass("tipoId")} ${
                !tipoId ? "text-slate-400" : "text-slate-900"
              }`}
              value={tipoId ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setTipoId(value);
                if (value) clearError("tipoId");
              }}
            >
              <option value="" disabled>
                Seleccionar tipo
              </option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
            {errors.tipoId && (
              <p className="mt-1 text-sm text-red-500">{errors.tipoId}</p>
            )}
          </>
        </Field>

        <Field label="Investigadores">
          <>
            <PersonalProyectoField
              value={investigadoresIds}
              options={investigadores}
              onChange={(ids) => {
                setInvestigadoresIds(ids);
                if (ids.length > 0) clearError("investigadores");
              }}
              isEdit={isEdit}
              onRemoveConfirm={(personaId) => {
                const inv = investigadores.find((i) => i.id === personaId);

                if (inv) {
                  setInvestigadorAEliminar({
                    id: inv.id,
                    nombre: inv.nombre_apellido,
                  });
                }
              }}
            />
            {errors.investigadores && (
              <p className="mt-1 text-sm text-red-500">{errors.investigadores}</p>
            )}
          </>
        </Field>

        <Field label="Fecha de inicio">
          <Calendar
            value={fechaInicio}
            onChange={(date) => {
              setFechaInicio(date);
              if (date) clearError("fechaInicio");
            }}
            className={inputClass("fechaInicio")}
            helperText={errors.fechaInicio ?? "DD/MM/AAAA"}
          />
        </Field>

        <div className="flex justify-between pt-6">
          <Button type="button" variant="secondary" size="sm" onClick={() => navigate(-1)}>
            Volver
          </Button>

          <Button type="submit" size="sm" disabled={mutation.isPending || !uct}>
            {mutation.isPending ? (isEdit ? "Actualizando..." : "Guardando...") : isEdit ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={!!investigadorAEliminar}
        title="Desvincular investigador"
        message={`¿Desea desvincular a ${investigadorAEliminar?.nombre}?`}
        items={[]}
        onCancel={() => setInvestigadorAEliminar(null)}
        onConfirm={() => desvincularMutation.mutate(investigadorAEliminar!.id)}
      />

      <SuccessToast
        open={showSuccess}
        message={successMessage}
        onClose={() => setShowSuccess(false)}
      />

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
