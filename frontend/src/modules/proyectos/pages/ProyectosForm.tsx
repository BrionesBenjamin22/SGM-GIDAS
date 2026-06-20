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
import { HttpError } from "@/lib/http";
import {
  getProyectoById,
  type Proyecto,
  upsertProyectos,
  vincularBecarios,
  vincularInvestigadores,
} from "@/modules/proyectos/services/proyectosServices";

export default function ProyectosForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
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
      initialData.fechaInicio ? new Date(initialData.fechaInicio) : null
    );
    setFechaFin(
      initialData.fechaFinalizacion
        ? new Date(initialData.fechaFinalizacion)
        : null
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
  }, [initialData]);

  useEffect(() => {
    if (coordinadorId !== null && !investigadoresIds.includes(coordinadorId)) {
      setCoordinadorId(null);
    }
  }, [coordinadorId, investigadoresIds]);

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

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const shouldSkipUpsert = payload._skipUpsert === true;
      const proyecto: any = shouldSkipUpsert
        ? { id: payload.id }
        : await upsertProyectos(payload);
      const proyectoId = Number(proyecto?.id ?? payload.id);
      const fechaInicioVinculacion =
        payload.fechaInicio ?? initialData?.fechaInicio;

      const investigadoresAAgregar = isEdit
        ? investigadoresIds.filter(
            (idInvestigador) =>
              !investigadoresInicialesIds.includes(idInvestigador)
          )
        : investigadoresIds;

      const becariosAAgregar = isEdit
        ? becariosIds.filter(
            (idBecario) => !becariosInicialesIds.includes(idBecario)
          )
        : becariosIds;

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

      return proyecto;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proyectos"] });
      qc.invalidateQueries({ queryKey: ["proyecto", id] });
      qc.invalidateQueries({ queryKey: ["proyecto-historial", id] });

      if (isEdit && id) {
        navigate(`/proyectos/${id}`, {
          replace: true,
          state: {
            successMessage: "Proyecto actualizado con exito.",
          },
        });
        return;
      }

      navigate("/proyectos", {
        state: {
          successMessage: "Proyecto creado con exito.",
        },
      });
    },
    onError: (error) => {
      const defaultMessage = isEdit
        ? "No se pudo actualizar el proyecto."
        : "No se pudo crear el proyecto.";

      if (error instanceof HttpError && error.body && typeof error.body === "object") {
        const body = error.body as Record<string, unknown>;
        const backendMessage =
          typeof body.error === "string"
            ? body.error
            : typeof body.message === "string"
              ? body.message
              : null;

        setErrorMessage(backendMessage ?? defaultMessage);
      } else {
        setErrorMessage(defaultMessage);
      }

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

    if (!codigoProyecto.trim()) {
      newErrors.codigoProyecto = "Debe ingresar codigo de proyecto";
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
      codigoProyecto: Number(codigoProyecto),
      descripcionProyecto,
      dificultadesProyecto,
      montoDestinado:
        montoDestinado.trim() !== ""
          ? Number(montoDestinado)
          : undefined,
      grupoUtnId: uct?.id ?? undefined,
      fechaInicio: fechaInicio?.toISOString().split("T")[0],
      fechaFinalizacion: fechaFin
        ? fechaFin.toISOString().split("T")[0]
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
      codigoProyecto: Number(initialData?.codigoProyecto ?? 0),
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
        return initialPayload[key as keyof typeof initialPayload] !== value;
      })
    );

    const hayNuevosInvestigadores = investigadoresIds.some(
      (idInvestigador) => !investigadoresInicialesIds.includes(idInvestigador)
    );
    const hayNuevosBecarios = becariosIds.some(
      (idBecario) => !becariosInicialesIds.includes(idBecario)
    );

    if (
      Object.keys(changedPayload).length === 0 &&
      !hayNuevosInvestigadores &&
      !hayNuevosBecarios
    ) {
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
        : changedPayload
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

      <form
        onSubmit={submit}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <Field label="Codigo del proyecto">
          <>
            <input
              className={inputClass("codigoProyecto")}
              value={codigoProyecto}
              onChange={(e) => {
                setCodigoProyecto(e.target.value);
                if (e.target.value.trim()) clearError("codigoProyecto");
              }}
              placeholder="Ej: 1234"
              disabled={proyectoCerrado}
            />
            {errors.codigoProyecto && (
              <p className="mt-1 text-sm text-red-500">
                {errors.codigoProyecto}
              </p>
            )}
          </>
        </Field>

        <Field label="Nombre del proyecto">
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

        <Field label="Descripcion del proyecto">
          <textarea
            className="input min-h-[100px]"
            value={descripcionProyecto}
            onChange={(e) => setDescripcionProyecto(e.target.value)}
            placeholder="Describe detalladamente los objetivos, metodologia y alcance del proyecto."
            required
            disabled={proyectoCerrado}
          />
        </Field>

        <Field label="Dificultades del proyecto">
          <textarea
            className="input min-h-[100px]"
            value={dificultadesProyecto}
            onChange={(e) => setDificultadesProyecto(e.target.value)}
            placeholder="Describe dificultades, riesgos o bloqueos del proyecto."
            disabled={proyectoCerrado}
          />
        </Field>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Tipo de proyecto">
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

          <Field label="Fuente de financiamiento">
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
          <Field label="Monto destinado">
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              value={montoDestinado}
              onChange={(e) => setMontoDestinado(e.target.value)}
              placeholder="Ej: 1500000"
              disabled={proyectoCerrado}
            />
          </Field>
        </div>

        <Field label="Investigadores">
          <div className="space-y-4">
            <PersonalProyectoField
              value={investigadoresIds}
              options={investigadores}
              onChange={(ids) => {
                if (proyectoCerrado) return;
                setInvestigadoresIds(ids);
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

        <Field label="Becarios">
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
          <Field label="Fecha inicio">
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

          <Field label="Fecha fin">
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
