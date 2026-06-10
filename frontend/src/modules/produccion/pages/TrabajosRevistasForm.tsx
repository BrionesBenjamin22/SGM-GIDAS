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
  createTrabajoRevista,
  updateTrabajoRevista,
  getTrabajoRevistaById,
  vincularInvestigadoresRevista,
  desvincularInvestigadoresRevista,
} from "@/services/trabajosRevistasServices";

import { useTiposReunion } from "@/hooks/useTiposReunion";
import { useInvestigadores } from "@/hooks/useInvestigadores";
import { useUctGuard } from "@/hooks/useUctGuard";

export default function TrabajosRevistasForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = Boolean(id);

  const { uct, uctGuard } = useUctGuard();
  const { tipos = [] } = useTiposReunion();
  const { data: investigadores = [] } = useInvestigadores();

  const { data: initialData, isLoading } = useQuery({
    queryKey: ["trabajo-revista", id],
    queryFn: () =>
      id ? getTrabajoRevistaById(Number(id)) : Promise.resolve(null),
    enabled: isEdit,
  });

  const [titulo, setTitulo] = useState("");
  const [nombreRevista, setNombreRevista] = useState("");
  const [editorial, setEditorial] = useState("");
  const [issn, setIssn] = useState("");
  const [pais, setPais] = useState("");
  const [fecha, setFecha] = useState<Date | null>(null);
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
    setNombreRevista(initialData.nombre_revista ?? "");
    setEditorial(initialData.editorial ?? "");
    setIssn(initialData.issn ?? "");
    setPais(initialData.pais ?? "");
    setFecha(initialData.fecha ? new Date(`${initialData.fecha}T00:00:00`) : null);
    setTipoId(initialData.tipo_reunion?.id ?? null);
    setInvestigadoresIds(
      initialData.investigadores?.map((i: { id: number }) => i.id) ?? []
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

    if (!titulo.trim()) newErrors.titulo = "Debe ingresar titulo";

    if (!nombreRevista.trim()) {
      newErrors.nombreRevista = "Debe ingresar nombre de revista";
    }

    if (!editorial.trim()) {
      newErrors.editorial = "Debe ingresar editorial";
    }

    if (!issn.trim()) {
      newErrors.issn = "Debe ingresar ISSN";
    }

    if (!pais.trim()) {
      newErrors.pais = "Debe ingresar pais";
    }

    if (!tipoId) {
      newErrors.tipoId = "Debe seleccionar tipo";
    }

    if (!fecha) {
      newErrors.fecha = "Debe seleccionar fecha";
    }

    if (investigadoresIds.length === 0) {
      newErrors.investigadores = "Debe agregar al menos un investigador";
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
    mutationFn: async (payload: any) => {
      const currentInvestigadoresIds =
        initialData?.investigadores?.map((i: { id: number }) => i.id) ?? [];
      const nuevosInvestigadoresIds = isEdit
        ? investigadoresIds.filter(
            (investigadorId) => !currentInvestigadoresIds.includes(investigadorId)
          )
        : investigadoresIds;

      let trabajo = initialData;

      if (!isEdit) {
        trabajo = await createTrabajoRevista(payload);
      } else if (!payload._skipUpdate) {
        trabajo = await updateTrabajoRevista(Number(id), payload);
      }

      const trabajoId = (trabajo as any)?.id;

      if (trabajoId && nuevosInvestigadoresIds.length > 0) {
        await vincularInvestigadoresRevista(trabajoId, nuevosInvestigadoresIds);
      }

      return trabajo;
    },
    onSuccess: async (saved: any) => {
      const trabajoId = saved?.id ?? Number(id);

      await qc.invalidateQueries({ queryKey: ["trabajos-revistas"] });
      await qc.invalidateQueries({ queryKey: ["trabajo-revista", trabajoId] });
      await qc.invalidateQueries({ queryKey: ["trabajo-revista-historial", trabajoId] });

      navigate(`/trabajos-revistas/${trabajoId}`, {
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
        ? "No se pudo actualizar el trabajo en revista."
        : "No se pudo crear el trabajo en revista.";

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
        } else if (lowerMessage.includes("revista")) {
          setErrors((prev) => ({ ...prev, nombreRevista: backendMessage }));
        } else if (lowerMessage.includes("editorial")) {
          setErrors((prev) => ({ ...prev, editorial: backendMessage }));
        } else if (lowerMessage.includes("issn")) {
          setErrors((prev) => ({ ...prev, issn: backendMessage }));
        } else if (lowerMessage.includes("pais")) {
          setErrors((prev) => ({ ...prev, pais: backendMessage }));
        } else if (lowerMessage.includes("tipo")) {
          setErrors((prev) => ({ ...prev, tipoId: backendMessage }));
        } else if (lowerMessage.includes("fecha")) {
          setErrors((prev) => ({ ...prev, fecha: backendMessage }));
        }
      }

      setErrorMessage(backendMessage);
      setShowError(true);
    },
  });

  const desvincularMutation = useMutation({
    mutationFn: async (investigadorId: number) =>
      desvincularInvestigadoresRevista(Number(id), [investigadorId]),
    onSuccess: async (_, investigadorId) => {
      setInvestigadoresIds((prev) => prev.filter((i) => i !== investigadorId));
      setInvestigadorAEliminar(null);

      await qc.invalidateQueries({ queryKey: ["trabajo-revista", Number(id)] });
      await qc.invalidateQueries({ queryKey: ["trabajo-revista-historial", Number(id)] });

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
      nombre_revista: toTitleCase(nombreRevista.trim()),
      editorial: toTitleCase(editorial.trim()),
      issn: issn.trim(),
      pais: toTitleCase(pais.trim()),
      fecha: formatDateStr(fecha)!,
      tipo_reunion_id: tipoId!,
      grupo_utn_id: uct.id,
    };

    if (!isEdit) {
      await mutation.mutateAsync(payload);
      return;
    }

    const initialPayload = {
      titulo_trabajo: initialData?.titulo_trabajo ?? "",
      nombre_revista: initialData?.nombre_revista ?? "",
      editorial: initialData?.editorial ?? "",
      issn: initialData?.issn ?? "",
      pais: initialData?.pais ?? "",
      fecha: initialData?.fecha ?? null,
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
      navigate(`/trabajos-revistas/${id}`, {
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
    return <p className="text-slate-500">Cargando...</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold md:text-3xl">
        {isEdit ? "Editar trabajo en revista" : "Nuevo trabajo en revista"}
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
              placeholder="Ej: Modelo de optimizacion aplicado a sistemas distribuidos"
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

        <Field label="Nombre de la revista">
          <>
            <input
              className={inputClass("nombreRevista")}
              value={nombreRevista}
              placeholder="Ej: Journal of Computer Science"
              onChange={(e) => {
                setNombreRevista(e.target.value);
                if (e.target.value.trim()) clearError("nombreRevista");
              }}
              onBlur={() => {
                if (nombreRevista.trim()) {
                  setNombreRevista(toTitleCase(nombreRevista));
                }
              }}
            />
            {errors.nombreRevista && (
              <p className="mt-1 text-sm text-red-500">{errors.nombreRevista}</p>
            )}
          </>
        </Field>

        <Field label="Editorial">
          <>
            <input
              className={inputClass("editorial")}
              value={editorial}
              placeholder="Ej: Elsevier"
              onChange={(e) => {
                setEditorial(e.target.value);
                if (e.target.value.trim()) clearError("editorial");
              }}
              onBlur={() => {
                if (editorial.trim()) setEditorial(toTitleCase(editorial));
              }}
            />
            {errors.editorial && (
              <p className="mt-1 text-sm text-red-500">{errors.editorial}</p>
            )}
          </>
        </Field>

        <Field label="ISSN">
          <>
            <input
              className={inputClass("issn")}
              value={issn}
              placeholder="Ej: 1234-5678"
              onChange={(e) => {
                setIssn(e.target.value);
                if (e.target.value.trim()) clearError("issn");
              }}
            />
            {errors.issn && (
              <p className="mt-1 text-sm text-red-500">{errors.issn}</p>
            )}
          </>
        </Field>

        <Field label="Pais">
          <>
            <input
              className={inputClass("pais")}
              value={pais}
              placeholder="Ej: Argentina"
              onChange={(e) => {
                setPais(e.target.value);
                if (e.target.value.trim()) clearError("pais");
              }}
              onBlur={() => {
                if (pais.trim()) setPais(toTitleCase(pais));
              }}
            />
            {errors.pais && (
              <p className="mt-1 text-sm text-red-500">{errors.pais}</p>
            )}
          </>
        </Field>

        <Field label="Tipo">
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

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>

          <Button type="submit" size="sm" disabled={mutation.isPending}>
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

      <ConfirmDialog
        open={!!investigadorAEliminar}
        title="Desvincular investigador"
        message={`¿Desea desvincular a ${investigadorAEliminar?.nombre}?`}
        items={[]}
        onCancel={() => setInvestigadorAEliminar(null)}
        onConfirm={() =>
          desvincularMutation.mutate(investigadorAEliminar!.id)
        }
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
