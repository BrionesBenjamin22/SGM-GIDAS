import { applyFieldErrors } from "@/lib/httpError";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import Field from "@/components/Field";
import PersonalProyectoField from "@/components/PersonalProyectoField";
import SuccessToast from "@/components/SuccessToast";
import { useBecarios } from "@/modules/personal/hooks/useBecarios";
import { useFuentesFinanciamiento } from "@/modules/catalogos/hooks/useFuenteFinanciamiento";
import { useInvestigadores } from "@/modules/personal/hooks/useInvestigadores";
import { useTiposProyecto } from "@/modules/proyectos/hooks/useTiposProyecto";
import { useUct } from "@/modules/grupo/hooks/useUct";
import { getErrorMessage } from "@/lib/httpError";
import {
  desvincularBecarios,
  desvincularInvestigadores,
  getProyectoById,
  type Proyecto,
  type ProyectoPayload,
  upsertProyectos,
  vincularBecarios,
  vincularInvestigadores,
} from "@/modules/proyectos/services/proyectosServices";
import {
  PROYECTO_CODIGO_MAX_LENGTH,
  validateCodigoProyecto,
} from "@/modules/proyectos/utils/proyectoValidation";
import { parseCivilDate, toCivilDateString } from "@/utils/dateTime";
import { useAuth } from "@/context/AuthContext";
import DraftRecoveryNotice from "@/modules/shared/components/DraftRecoveryNotice";
import { useFormDraft } from "@/modules/shared/hooks/useFormDraft";

type ProyectoDraft = {
  nombreProyecto: string;
  codigoProyecto: string;
  descripcionProyecto: string;
  dificultadesProyecto: string;
  montoDestinado: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  tipoProyectoId: number | null;
  fuenteId: number | null;
  investigadoresIds: number[];
  coordinadorId: number | null;
  becariosIds: number[];
};

export default function ProyectosForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const tiposQuery = useTiposProyecto();
  const fuentesQuery = useFuentesFinanciamiento();
  const { data: investigadores = [] } = useInvestigadores();
  const { data: becarios = [] } = useBecarios();
  const { uct } = useUct();

  const tipos = tiposQuery.data || [];
  const { fuentes = [] } = fuentesQuery;

  const { data: initialData, isLoading } = useQuery<Proyecto | null>({
    queryKey: ["proyecto", id],
    queryFn: () =>
      id ? getProyectoById(Number(id)) : Promise.resolve(null),
    enabled: isEdit,
  });

  const [nombreProyecto, setNombreProyecto] = useState("");
  const [codigoProyecto, setCodigoProyecto] = useState("");
  const [descripcionProyecto, setDescripcionProyecto] = useState("");
  const [dificultadesProyecto, setDificultadesProyecto] = useState("");
  const [montoDestinado, setMontoDestinado] = useState("");

  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [tipoProyectoId, setTipoProyectoId] = useState<number | null>(null);
  const [fuenteId, setFuenteId] = useState<number | null>(null);

  const [investigadoresIds, setInvestigadoresIds] = useState<number[]>([]);
  const [coordinadorId, setCoordinadorId] = useState<number | null>(null);
  const [becariosIds, setBecariosIds] = useState<number[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formInitialized, setFormInitialized] = useState(!isEdit);

  const proyectoCerrado = initialData?.cerrado === true;

  useEffect(() => {
    if (!initialData) return;

    setNombreProyecto(initialData.nombreProyecto ?? "");
    setCodigoProyecto(initialData.codigoProyecto ?? "");
    setDescripcionProyecto(initialData.descripcionProyecto ?? "");
    setDificultadesProyecto(initialData.dificultadesProyecto ?? "");
    setMontoDestinado(
      initialData.montoDestinado !== undefined &&
        initialData.montoDestinado !== null
        ? String(initialData.montoDestinado)
        : ""
    );

    setFechaInicio(
      parseCivilDate(initialData.fechaInicio)
    );
    setFechaFin(
      parseCivilDate(initialData.fechaFinalizacion)
    );

    setTipoProyectoId(initialData.tipoProyectoId ?? null);
    setFuenteId(initialData.fuenteFinanciamientoId ?? null);

    const investigadoresIniciales =
      initialData.investigadores?.map((investigador) => investigador.id) ?? [];
    setInvestigadoresIds(investigadoresIniciales);

    const coordinadorInicial =
      initialData.investigadores?.find(
        (investigador) => investigador.es_coordinador
      )?.id ?? null;
    setCoordinadorId(coordinadorInicial);

    setBecariosIds(initialData.becarios?.map((becario) => becario.id) ?? []);
    setFormInitialized(true);
  }, [initialData]);

  useEffect(() => {
    if (coordinadorId !== null && !investigadoresIds.includes(coordinadorId)) {
      setCoordinadorId(null);
    }
  }, [coordinadorId, investigadoresIds]);

  const draftValue = useMemo<ProyectoDraft>(() => ({
    nombreProyecto,
    codigoProyecto,
    descripcionProyecto,
    dificultadesProyecto,
    montoDestinado,
    fechaInicio: toCivilDateString(fechaInicio),
    fechaFin: toCivilDateString(fechaFin),
    tipoProyectoId,
    fuenteId,
    investigadoresIds,
    coordinadorId,
    becariosIds,
  }), [
    becariosIds, codigoProyecto, coordinadorId, descripcionProyecto,
    dificultadesProyecto, fechaFin, fechaInicio, fuenteId, investigadoresIds,
    montoDestinado, nombreProyecto, tipoProyectoId,
  ]);

  const { availableDraft, restoreDraft, discardDraft, clearDraft } = useFormDraft({
    userId: user?.id,
    module: "proyectos",
    recordId: id,
    value: draftValue,
    ready: formInitialized,
    hasContent: (draft) => Boolean(
      draft.nombreProyecto || draft.codigoProyecto || draft.descripcionProyecto ||
      draft.dificultadesProyecto || draft.montoDestinado || draft.fechaInicio ||
      draft.fechaFin || draft.tipoProyectoId || draft.fuenteId ||
      draft.investigadoresIds.length || draft.becariosIds.length
    ),
    onRestore: (draft) => {
      setNombreProyecto(draft.nombreProyecto);
      setCodigoProyecto(draft.codigoProyecto);
      setDescripcionProyecto(draft.descripcionProyecto);
      setDificultadesProyecto(draft.dificultadesProyecto);
      setMontoDestinado(draft.montoDestinado);
      setFechaInicio(parseCivilDate(draft.fechaInicio));
      setFechaFin(parseCivilDate(draft.fechaFin));
      setTipoProyectoId(draft.tipoProyectoId);
      setFuenteId(draft.fuenteId);
      setInvestigadoresIds(draft.investigadoresIds);
      setCoordinadorId(draft.coordinadorId);
      setBecariosIds(draft.becariosIds);
    },
  });

  const investigadoresSeleccionados = useMemo(() => {
    return investigadores.filter((investigador) =>
      investigadoresIds.includes(investigador.id)
    );
  }, [investigadores, investigadoresIds]);

  const investigadoresInicialesIds = useMemo(
    () => initialData?.investigadores?.map((investigador) => investigador.id) ?? [],
    [initialData]
  );

  const becariosInicialesIds = useMemo(
    () => initialData?.becarios?.map((becario) => becario.id) ?? [],
    [initialData]
  );

  const coordinadorInicialId = useMemo(
    () =>
      initialData?.investigadores?.find(
        (investigador) => investigador.es_coordinador
      )?.id ?? null,
    [initialData]
  );

  type ProyectoFormMutationPayload = ProyectoPayload & {
    _skipUpsert?: boolean;
  };

  const mutation = useMutation({
    mutationFn: async (payload: ProyectoFormMutationPayload) => {
      const shouldSkipUpsert = payload._skipUpsert === true;
      const proyectoId = shouldSkipUpsert
        ? Number(payload.id)
        : Number((await upsertProyectos(payload)).id);
      const fechaInicioVinculacion =
        payload.fechaInicio ?? initialData?.fechaInicio;

      if (!fechaInicioVinculacion || !Number.isFinite(proyectoId)) {
        throw new Error("No se pudo determinar el proyecto o su fecha de inicio.");
      }

      const cambioCoordinador = isEdit && coordinadorInicialId !== coordinadorId;
      const investigadoresConRolCambiado = cambioCoordinador
        ? [coordinadorInicialId, coordinadorId].filter(
            (value): value is number =>
              value !== null &&
              investigadoresInicialesIds.includes(value) &&
              investigadoresIds.includes(value)
          )
        : [];

      const investigadoresAAgregar = Array.from(new Set(isEdit
        ? [
            ...investigadoresIds.filter(
            (idInvestigador) =>
              !investigadoresInicialesIds.includes(idInvestigador)
            ),
            ...investigadoresConRolCambiado,
          ]
        : investigadoresIds));

      const investigadoresADesvincular = isEdit
        ? Array.from(new Set([
            ...investigadoresInicialesIds.filter(
              (idInvestigador) => !investigadoresIds.includes(idInvestigador)
            ),
            ...investigadoresConRolCambiado,
          ]))
        : [];

      const becariosAAgregar = isEdit
        ? becariosIds.filter(
            (idBecario) => !becariosInicialesIds.includes(idBecario)
          )
        : becariosIds;

      const becariosADesvincular = isEdit
        ? becariosInicialesIds.filter(
            (idBecario) => !becariosIds.includes(idBecario)
          )
        : [];

      const fechaDesvinculacion = toCivilDateString(new Date());
      if (!fechaDesvinculacion) return;

      if (investigadoresADesvincular.length > 0) {
        await desvincularInvestigadores(
          proyectoId,
          fechaDesvinculacion,
          investigadoresADesvincular
        );
      }

      if (becariosADesvincular.length > 0) {
        await desvincularBecarios(
          proyectoId,
          fechaDesvinculacion,
          becariosADesvincular
        );
      }

      if (investigadoresAAgregar.length > 0) {
        await vincularInvestigadores(
          proyectoId,
          investigadoresAAgregar.map((idInvestigador) => ({
            id_investigador: idInvestigador,
            fecha_inicio: fechaInicioVinculacion,
            fecha_fin: null,
            es_coordinador: coordinadorId === idInvestigador,
          }))
        );
      }

      if (becariosAAgregar.length > 0) {
        await vincularBecarios(
          proyectoId,
          becariosAAgregar,
          fechaInicioVinculacion
        );
      }

      return { id: proyectoId };
    },
    onSuccess: () => {
      clearDraft();
      qc.invalidateQueries({ queryKey: ["proyectos"] });
      qc.invalidateQueries({ queryKey: ["proyecto", id] });
      qc.invalidateQueries({ queryKey: ["proyecto-historial", id] });

      if (isEdit && id) {
        navigate(`/proyectos/${id}`, {
          replace: true,
          state: {
            successMessage: "Proyecto actualizado con éxito.",
          },
        });
        return;
      }

      navigate("/proyectos", {
        state: {
          successMessage: "Proyecto creado con éxito.",
        },
      });
    },
    onError: (error) => {
      if (applyFieldErrors(error, setErrors, ["codigoProyecto","nombreProyecto","tipoProyectoId","fechaInicio","montoDestinado","coordinadorId","investigadoresIds","descripcionProyecto","dificultadesProyecto","fuenteId","becariosIds","fechaFin"])) return;
      const defaultMessage = isEdit
        ? "No se pudo actualizar el proyecto."
        : "No se pudo crear el proyecto.";

      setErrorMessage(getErrorMessage(error, defaultMessage));

      setShowError(true);
    },
  });

  const clearError = (field: string) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const codigoProyectoError = validateCodigoProyecto(codigoProyecto);
    if (codigoProyectoError) {
      newErrors.codigoProyecto = codigoProyectoError;
    }

    if (!nombreProyecto.trim()) {
      newErrors.nombreProyecto = "Debe ingresar nombre del proyecto";
    }

    if (!tipoProyectoId) {
      newErrors.tipoProyectoId = "Debe seleccionar tipo de proyecto";
    }

    if (!fechaInicio) {
      newErrors.fechaInicio = "Debe seleccionar fecha de inicio";
    }

    if (
      montoDestinado.trim() !== "" &&
      (!Number.isFinite(Number(montoDestinado)) || Number(montoDestinado) < 0)
    ) {
      newErrors.montoDestinado = "El monto debe ser un numero mayor o igual a cero";
    }

    if (investigadoresIds.length > 0 && coordinadorId === null) {
      newErrors.coordinadorId =
        "Debe seleccionar un coordinador entre los investigadores elegidos";
    }

    if (
      coordinadorId !== null &&
      !investigadoresIds.includes(coordinadorId)
    ) {
      newErrors.coordinadorId =
        "El coordinador debe ser uno de los investigadores seleccionados";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (proyectoCerrado) return;
    if (!validate()) return;

    const payload = {
      id: id ?? undefined,
      nombreProyecto,
      codigoProyecto: codigoProyecto.trim(),
      descripcionProyecto,
      dificultadesProyecto,
      montoDestinado:
        montoDestinado.trim() !== ""
          ? Number(montoDestinado)
          : undefined,
      grupoUtnId: uct?.id ?? undefined,
      fechaInicio: toCivilDateString(fechaInicio) ?? undefined,
      fechaFinalizacion: fechaFin
        ? toCivilDateString(fechaFin)
        : undefined,
      tipoProyectoId,
      fuenteFinanciamientoId: fuenteId ?? undefined,
    };

    if (!isEdit) {
      mutation.mutate(payload);
      return;
    }

    const initialPayload = {
      nombreProyecto: initialData?.nombreProyecto ?? "",
      codigoProyecto: initialData?.codigoProyecto ?? "",
      descripcionProyecto: initialData?.descripcionProyecto ?? "",
      dificultadesProyecto: initialData?.dificultadesProyecto ?? "",
      montoDestinado:
        initialData?.montoDestinado !== undefined &&
        initialData?.montoDestinado !== null
          ? Number(initialData.montoDestinado)
          : undefined,
      grupoUtnId: initialData?.grupoUtnId ?? uct?.id ?? undefined,
      fechaInicio: initialData?.fechaInicio ?? undefined,
      fechaFinalizacion: initialData?.fechaFinalizacion ?? undefined,
      tipoProyectoId: initialData?.tipoProyectoId ?? null,
      fuenteFinanciamientoId: initialData?.fuenteFinanciamientoId ?? undefined,
    };

    const changedPayload = Object.fromEntries(
      Object.entries(payload).filter(([key, value]) => {
        if (key === "id") return false;
        return initialPayload[key as keyof typeof initialPayload] !== value;
      })
    );

    const hayNuevosInvestigadores = investigadoresIds.some(
      (idInvestigador) => !investigadoresInicialesIds.includes(idInvestigador)
    );
    const hayNuevosBecarios = becariosIds.some(
      (idBecario) => !becariosInicialesIds.includes(idBecario)
    );
    const hayInvestigadoresDesvinculados = investigadoresInicialesIds.some(
      (idInvestigador) => !investigadoresIds.includes(idInvestigador)
    );
    const hayBecariosDesvinculados = becariosInicialesIds.some(
      (idBecario) => !becariosIds.includes(idBecario)
    );
    const cambioCoordinador = coordinadorInicialId !== coordinadorId;

    if (
      Object.keys(changedPayload).length === 0 &&
      !hayNuevosInvestigadores &&
      !hayNuevosBecarios &&
      !hayInvestigadoresDesvinculados &&
      !hayBecariosDesvinculados &&
      !cambioCoordinador
    ) {
      clearDraft();
      navigate(`/proyectos/${id}`, {
        replace: true,
        state: {
          successMessage: "No hubo cambios para actualizar.",
        },
      });
      return;
    }

    mutation.mutate(
      Object.keys(changedPayload).length === 0
        ? {
            id,
            _skipUpsert: true,
          }
        : { ...changedPayload, id }
    );
  };

  if (isEdit && isLoading) {
    return <p>Cargando proyecto...</p>;
  }

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        {isEdit ? "Editar proyecto" : "Nuevo proyecto"}
      </h2>

      {proyectoCerrado && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Este proyecto se encuentra cerrado. Para modificar investigadores,
          becarios o volver a editarlo, primero debes reabrirlo desde el
          detalle.
        </div>
      )}

      {availableDraft && (
        <DraftRecoveryNotice
          savedAt={availableDraft.savedAt}
          onRestore={restoreDraft}
          onDiscard={discardDraft}
        />
      )}

      <form
        noValidate
        onSubmit={submit}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <Field label="Código del proyecto" name="codigoProyecto" error={errors.codigoProyecto}>
          <>
            <input
              id="codigo-proyecto"
              className={inputClass("codigoProyecto")}
              value={codigoProyecto}
              onChange={(e) => {
                setCodigoProyecto(e.target.value);
                clearError("codigoProyecto");
              }}
              placeholder="Ej: LPSIEC1347"
              maxLength={PROYECTO_CODIGO_MAX_LENGTH}
              aria-label="Código del proyecto"
              aria-invalid={Boolean(errors.codigoProyecto)}
              aria-describedby={
                errors.codigoProyecto ? "codigo-proyecto-error" : undefined
              }
              disabled={proyectoCerrado}
            />
            {errors.codigoProyecto && (
              <p
                id="codigo-proyecto-error"
                role="alert"
                className="mt-1 text-sm text-red-500"
              >
                {errors.codigoProyecto}
              </p>
            )}
          </>
        </Field>

        <Field label="Nombre del proyecto" name="nombreProyecto" error={errors.nombreProyecto}>
          <>
            <input
              className={inputClass("nombreProyecto")}
              value={nombreProyecto}
              onChange={(e) => {
                setNombreProyecto(e.target.value);
                if (e.target.value.trim()) clearError("nombreProyecto");
              }}
              placeholder="Ingrese el nombre del proyecto"
              disabled={proyectoCerrado}
            />
            {errors.nombreProyecto && (
              <p className="mt-1 text-sm text-red-500">
                {errors.nombreProyecto}
              </p>
            )}
          </>
        </Field>

        <Field label="Descripción del proyecto" name="descripcionProyecto" error={errors.descripcionProyecto}>
          <textarea
            className="input min-h-[100px]"
            value={descripcionProyecto}
            onChange={(e) => setDescripcionProyecto(e.target.value)}
            placeholder="Describe detalladamente los objetivos, metodología y alcance del proyecto."
            required
            disabled={proyectoCerrado}
          />
        </Field>

        <Field label="Dificultades del proyecto" name="dificultadesProyecto" error={errors.dificultadesProyecto}>
          <textarea
            className="input min-h-[100px]"
            value={dificultadesProyecto}
            onChange={(e) => setDificultadesProyecto(e.target.value)}
            placeholder="Describe dificultades, riesgos o bloqueos del proyecto."
            disabled={proyectoCerrado}
          />
        </Field>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Tipo de proyecto" name="tipoProyectoId" error={errors.tipoProyectoId}>
            <>
              <select
                className={inputClass("tipoProyectoId")}
                value={tipoProyectoId ?? ""}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  setTipoProyectoId(value);
                  if (value) clearError("tipoProyectoId");
                }}
                disabled={proyectoCerrado}
              >
                <option value="" disabled>
                  Seleccionar tipo
                </option>
                {tipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
              {errors.tipoProyectoId && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.tipoProyectoId}
                </p>
              )}
            </>
          </Field>

          <Field label="Fuente de financiamiento" name="fuenteId" error={errors.fuenteId}>
            <select
              className="input"
              value={fuenteId ?? ""}
              onChange={(e) =>
                setFuenteId(e.target.value ? Number(e.target.value) : null)
              }
              disabled={proyectoCerrado}
            >
              <option value="">Sin fuente</option>
              {fuentes.map((fuente) => (
                <option key={fuente.id} value={fuente.id}>
                  {fuente.nombre}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Monto destinado" name="montoDestinado" error={errors.montoDestinado}>
            <>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass("montoDestinado")}
                value={montoDestinado}
                onChange={(e) => {
                  setMontoDestinado(e.target.value);
                  clearError("montoDestinado");
                }}
                placeholder="Ej: 1500000"
                disabled={proyectoCerrado}
              />
              {errors.montoDestinado && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.montoDestinado}
                </p>
              )}
            </>
          </Field>
        </div>

        <Field label="Investigadores" name="investigadoresIds" error={errors.investigadoresIds}>
          <div className="space-y-4" data-error-field="coordinadorId" tabIndex={-1}>
            <PersonalProyectoField
              value={investigadoresIds}
              options={investigadores}
              onChange={(ids) => {
                if (proyectoCerrado) return;
                setInvestigadoresIds(ids);
                clearError("investigadoresIds");
                clearError("coordinadorId");
              }}
            />

            {investigadoresSeleccionados.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-medium text-slate-800">
                  Seleccionar coordinador
                </p>

                <div className="space-y-2">
                  {investigadoresSeleccionados.map((investigador) => (
                    <label
                      key={investigador.id}
                      className={`flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 ${
                        proyectoCerrado
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        name="coordinador"
                        checked={coordinadorId === investigador.id}
                        onChange={() => {
                          if (proyectoCerrado) return;
                          setCoordinadorId(investigador.id);
                          clearError("coordinadorId");
                        }}
                        disabled={proyectoCerrado}
                      />
                      <span className="text-sm text-slate-700">
                        {investigador.nombre_apellido}
                      </span>
                    </label>
                  ))}
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Solo un investigador puede quedar marcado como coordinador.
                </p>
              </div>
            )}

            {errors.coordinadorId && (
              <p className="mt-1 text-sm text-red-500">
                {errors.coordinadorId}
              </p>
            )}
          </div>
        </Field>

        <Field label="Becarios" name="becariosIds" error={errors.becariosIds}>
          <PersonalProyectoField
            value={becariosIds}
            options={becarios}
            onChange={(ids) => {
              if (proyectoCerrado) return;
              setBecariosIds(ids);
            }}
          />
        </Field>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Fecha inicio" name="fechaInicio" error={errors.fechaInicio}>
            <Calendar
              value={fechaInicio}
              onChange={(date) => {
                if (proyectoCerrado) return;
                setFechaInicio(date);
                if (date) clearError("fechaInicio");
              }}
              className={inputClass("fechaInicio")}
              helperText={errors.fechaInicio ?? "DD/MM/AAAA"}
            />
          </Field>

          <Field label="Fecha fin" name="fechaFin" error={errors.fechaFin}>
            <Calendar
              value={fechaFin}
              onChange={(date) => {
                if (proyectoCerrado) return;
                setFechaFin(date);
              }}
              minDate={fechaInicio ?? undefined}
              className="input"
            />
          </Field>
        </div>

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>

          {!proyectoCerrado && (
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Guardando..."
                : isEdit
                  ? "Actualizar"
                  : "Guardar"}
            </Button>
          )}
        </div>
      </form>

      <SuccessToast
        open={showError}
        message={errorMessage}
        onClose={() => setShowError(false)}
        variant="error"
      />
    </section>
  );
}
