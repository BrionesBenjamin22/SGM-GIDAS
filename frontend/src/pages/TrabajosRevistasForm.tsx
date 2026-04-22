import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import PersonalProyectoField from "@/components/PersonalProyectoField";
import Field from "@/components/Field";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";

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

  const [investigadorAEliminar, setInvestigadorAEliminar] =
    useState<{ id: number; nombre: string } | null>(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!initialData) return;

    setTitulo(initialData.titulo_trabajo ?? "");
    setNombreRevista(initialData.nombre_revista ?? "");
    setEditorial(initialData.editorial ?? "");
    setIssn(initialData.issn ?? "");
    setPais(initialData.pais ?? "");

    if (initialData.fecha) {
      setFecha(new Date(initialData.fecha));
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

    if (!titulo.trim()) newErrors.titulo = "Debe ingresar título";

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
      newErrors.pais = "Debe ingresar país";
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

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const trabajo = isEdit
        ? await updateTrabajoRevista(Number(id), payload)
        : await createTrabajoRevista(payload);

      const trabajoId = (trabajo as any)?.id;

      if (trabajoId && investigadoresIds.length > 0) {
        await vincularInvestigadoresRevista(trabajoId, investigadoresIds);
      }

      return trabajo;
    },
    onSuccess: (saved: any) => {
      qc.invalidateQueries({ queryKey: ["trabajos-revistas"] });
      qc.invalidateQueries({ queryKey: ["trabajo-revista", id] });

      navigate(`/trabajos-revistas/${saved.id}`, {
        state: {
          successMessage: isEdit
            ? "Trabajo actualizado con éxito!"
            : "Trabajo creado con éxito!",
        },
      });
    },
  });

  const desvincularMutation = useMutation({
    mutationFn: async (investigadorId: number) =>
      desvincularInvestigadoresRevista(Number(id), [investigadorId]),
    onSuccess: (_, investigadorId) => {
      setInvestigadoresIds((prev) => prev.filter((i) => i !== investigadorId));
      setInvestigadorAEliminar(null);
      setSuccessMessage("Investigador desvinculado con éxito!");
      setShowSuccess(true);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!uct) return;
    if (!validate()) return;

    mutation.mutate({
      titulo_trabajo: toTitleCase(titulo.trim()),
      nombre_revista: toTitleCase(nombreRevista.trim()),
      editorial: toTitleCase(editorial.trim()),
      issn: issn.trim(),
      pais: toTitleCase(pais.trim()),
      fecha: fecha!.toISOString().split("T")[0],
      tipo_reunion_id: tipoId!,
      grupo_utn_id: uct.id,
    });
  };

  if (isEdit && isLoading) {
    return <p className="text-slate-500">Cargando…</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold">
        {isEdit ? "Editar trabajo en revista" : "Nuevo trabajo en revista"}
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
              placeholder="Ej: Modelo de optimización aplicado a sistemas distribuidos"
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
              <p className="text-red-500 text-sm mt-1">
                {errors.nombreRevista}
              </p>
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
              <p className="text-red-500 text-sm mt-1">{errors.editorial}</p>
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
              <p className="text-red-500 text-sm mt-1">{errors.issn}</p>
            )}
          </>
        </Field>

        <Field label="País">
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
              <p className="text-red-500 text-sm mt-1">{errors.pais}</p>
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