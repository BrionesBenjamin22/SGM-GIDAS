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
} from "@/services/trabajosReunionServices";

import { useTiposReunion } from "@/hooks/useTiposReunion";
import { useInvestigadores } from "@/hooks/useInvestigadores";
import { useUctGuard } from "@/hooks/useUctGuard";

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
    queryFn: () =>
      id ? getTrabajoReunionById(Number(id)) : Promise.resolve(null),
    enabled: isEdit,
  });

  const [titulo, setTitulo] = useState("");
  const [nombreReunion, setNombreReunion] = useState("");
  const [procedencia, setProcedencia] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [tipoId, setTipoId] = useState<number | null>(null);
  const [investigadoresIds, setInvestigadoresIds] = useState<number[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [investigadorAEliminar, setInvestigadorAEliminar] =
    useState<{ id: number; nombre: string } | null>(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!initialData) return;

    setTitulo(initialData.titulo_trabajo ?? "");
    setNombreReunion(initialData.nombre_reunion ?? "");
    setProcedencia(initialData.procedencia ?? "");

    if (initialData.fecha_inicio) {
      setFechaInicio(new Date(initialData.fecha_inicio));
    }

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

    if (!titulo.trim()) {
      newErrors.titulo = "Debe ingresar título";
    }

    if (!nombreReunion.trim()) {
      newErrors.nombreReunion = "Debe ingresar nombre de reunión";
    }

    if (!procedencia.trim()) {
      newErrors.procedencia = "Debe ingresar procedencia";
    }

    if (!tipoId) {
      newErrors.tipoId = "Debe seleccionar tipo de reunión";
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
      const trabajo: any = isEdit
        ? await updateTrabajoReunion(Number(id), payload)
        : await createTrabajoReunion(payload);

      const trabajoId = trabajo?.id;

      if (trabajoId && investigadoresIds.length > 0) {
        await vincularInvestigadoresTrabajo(trabajoId, investigadoresIds);
      }

      return trabajo;
    },
    onSuccess: async (saved: any) => {
      await qc.invalidateQueries({ queryKey: ["trabajos-reunion"] });
      await qc.invalidateQueries({ queryKey: ["trabajo-reunion", id] });

      navigate(`/trabajos-reunion/${saved.id}`, {
        state: {
          successMessage: isEdit
            ? "Trabajo actualizado con éxito!"
            : "Trabajo creado con éxito!",
        },
      });
    },
  });

  const desvincularMutation = useMutation({
    mutationFn: async (investigadorId: number) => {
      return desvincularInvestigadoresTrabajo(Number(id), [investigadorId]);
    },
    onSuccess: (_, investigadorId) => {
      setInvestigadoresIds((prev) => prev.filter((i) => i !== investigadorId));
      setInvestigadorAEliminar(null);
      setSuccessMessage("Investigador desvinculado con éxito!");
      setShowSuccess(true);
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uct) return;
    if (!validate()) return;

    try {
      await mutation.mutateAsync({
        titulo_trabajo: toTitleCase(titulo.trim()),
        nombre_reunion: toTitleCase(nombreReunion.trim()),
        procedencia: toTitleCase(procedencia.trim()),
        fecha_inicio: fechaInicio!.toISOString().split("T")[0],
        tipo_reunion_id: tipoId!,
        grupo_utn_id: uct.id,
      });
    } catch (error) {
      if (error instanceof HttpError) {
        const body = error.body as
          | { message?: string; error?: string; detalle?: string }
          | undefined;

        const backendMessage =
          body?.error || body?.message || body?.detalle || "";

        const lowerMessage = backendMessage.toLowerCase();

        if (lowerMessage.includes("titulo")) {
          setErrors((prev) => ({
            ...prev,
            titulo: backendMessage,
          }));
          return;
        }

        if (lowerMessage.includes("reunión") || lowerMessage.includes("reunion")) {
          setErrors((prev) => ({
            ...prev,
            nombreReunion: backendMessage,
          }));
          return;
        }

        if (lowerMessage.includes("procedencia")) {
          setErrors((prev) => ({
            ...prev,
            procedencia: backendMessage,
          }));
          return;
        }

        if (lowerMessage.includes("tipo")) {
          setErrors((prev) => ({
            ...prev,
            tipoId: backendMessage,
          }));
          return;
        }

        if (lowerMessage.includes("fecha")) {
          setErrors((prev) => ({
            ...prev,
            fechaInicio: backendMessage,
          }));
          return;
        }
      }

      setErrors((prev) => ({
        ...prev,
        general: "No se pudo guardar el trabajo presentado.",
      }));
    }
  };

  if (isEdit && isLoading) {
    return <p className="text-slate-500">Cargando trabajo…</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        {isEdit ? "Editar trabajo" : "Nuevo trabajo"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
      >
        <Field label="Título del trabajo">
          <>
            <input
              className={inputClass("titulo")}
              value={titulo}
              placeholder="Ej: Aplicación de modelos predictivos en sistemas complejos"
              onChange={(e) => {
                setTitulo(e.target.value);
                if (e.target.value.trim()) clearError("titulo");
              }}
              onBlur={() => {
                if (titulo.trim()) setTitulo(toTitleCase(titulo));
              }}
            />
            {errors.titulo && (
              <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>
            )}
          </>
        </Field>

        <Field label="Nombre de la reunión">
          <>
            <input
              className={inputClass("nombreReunion")}
              value={nombreReunion}
              placeholder="Ej: Congreso Argentino de Ingeniería"
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
              <p className="text-red-500 text-sm mt-1">
                {errors.nombreReunion}
              </p>
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
              <p className="text-red-500 text-sm mt-1">
                {errors.procedencia}
              </p>
            )}
          </>
        </Field>

        <Field label="Tipo de reunión">
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
              <p className="text-red-500 text-sm mt-1">{errors.tipoId}</p>
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
              <p className="text-red-500 text-sm mt-1">
                {errors.investigadores}
              </p>
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

      {uctGuard}
    </section>
  );
}