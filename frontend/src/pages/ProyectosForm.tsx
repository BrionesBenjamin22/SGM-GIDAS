import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import Field from "@/components/Field";
import PersonalProyectoField from "@/components/PersonalProyectoField";

import {
  upsertProyectos,
  getProyectoById,
  type Proyecto,
  vincularBecarios,
  vincularInvestigadores,
} from "@/services/proyectosServices";

import { useTiposProyecto } from "@/hooks/useTiposProyecto";
import { useFuentesFinanciamiento } from "@/hooks/useFuenteFinanciamiento";
import { useInvestigadores } from "@/hooks/useInvestigadores";
import { useBecarios } from "@/hooks/useBecarios";
import { usePlanificaciones } from "@/hooks/usePlanificacionesGrupo";
import { useUct } from "@/hooks/useUct";

export default function ProyectosForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = Boolean(id);

  const tiposQuery = useTiposProyecto();
  const fuentesQuery = useFuentesFinanciamiento();
  const { data: investigadores = [] } = useInvestigadores();
  const { data: becarios = [] } = useBecarios();
  const { list: planificaciones = [] } = usePlanificaciones();
  const { uct } = useUct();

  const tipos = tiposQuery.data || [];
  const { fuentes = [] } = fuentesQuery;

  const planificacionesDelGrupo = useMemo(() => {
    if (!uct?.id) return [];
    return planificaciones.filter((p) => p.grupo_id === uct.id);
  }, [planificaciones, uct]);

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
  const [planificacionId, setPlanificacionId] = useState<number | null>(null);

  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [tipoProyectoId, setTipoProyectoId] = useState<number | null>(null);
  const [fuenteId, setFuenteId] = useState<number | null>(null);

  const [investigadoresIds, setInvestigadoresIds] = useState<number[]>([]);
  const [coordinadorId, setCoordinadorId] = useState<number | null>(null);
  const [becariosIds, setBecariosIds] = useState<number[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (initialData.fechaInicio) {
      setFechaInicio(new Date(initialData.fechaInicio));
    }

    if (initialData.fechaFinalizacion) {
      setFechaFin(new Date(initialData.fechaFinalizacion));
    }

    setTipoProyectoId(initialData.tipoProyectoId ?? null);
    setFuenteId(initialData.fuenteFinanciamientoId ?? null);
    setPlanificacionId(initialData.planificacionId ?? null);

    const investigadoresIniciales =
      initialData.investigadores?.map((i) => i.id) ?? [];
    setInvestigadoresIds(investigadoresIniciales);

    const coordinadorInicial =
      initialData.investigadores?.find((i) => i.es_coordinador)?.id ?? null;
    setCoordinadorId(coordinadorInicial);

    setBecariosIds(initialData.becarios?.map((b) => b.id) ?? []);
  }, [initialData]);

  useEffect(() => {
    if (
      coordinadorId !== null &&
      !investigadoresIds.includes(coordinadorId)
    ) {
      setCoordinadorId(null);
    }
  }, [investigadoresIds, coordinadorId]);

  const investigadoresSeleccionados = useMemo(() => {
    return investigadores.filter((inv) =>
      investigadoresIds.includes(inv.id)
    );
  }, [investigadores, investigadoresIds]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const proyecto: any = await upsertProyectos(payload);
      const proyectoId = Number(proyecto?.id ?? payload.id);

      if (investigadoresIds.length > 0) {
        await vincularInvestigadores(
          proyectoId,
          investigadoresIds.map((idInvestigador) => ({
            id_investigador: idInvestigador,
            fecha_inicio: payload.fechaInicio,
            fecha_fin: null,
            es_coordinador: coordinadorId === idInvestigador,
          }))
        );
      }

      if (becariosIds.length > 0) {
        await vincularBecarios(
          proyectoId,
          becariosIds,
          payload.fechaInicio
        );
      }

      return proyecto;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proyectos"] });
      qc.invalidateQueries({ queryKey: ["proyecto", id] });
      navigate("/proyectos");
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
      newErrors.codigoProyecto = "Debe ingresar código de proyecto";
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

    if (proyectoCerrado) {
      return;
    }

    if (!validate()) return;

    mutation.mutate({
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
      planificacionId: planificacionId ?? undefined,
      fechaInicio: fechaInicio!.toISOString().split("T")[0],
      fechaFinalizacion: fechaFin
        ? fechaFin.toISOString().split("T")[0]
        : undefined,
      tipoProyectoId: tipoProyectoId!,
      fuenteFinanciamientoId: fuenteId ?? undefined,
    });
  };

  if (isEdit && isLoading) {
    return <p>Cargando proyecto…</p>;
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
          Este proyecto se encuentra cerrado. Para modificar investigadores, becarios
          o volver a editarlo, primero debés reabrirlo desde el detalle.
        </div>
      )}

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
      >
        <Field label="Código del proyecto">
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
              <p className="text-red-500 text-sm mt-1">
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
              <p className="text-red-500 text-sm mt-1">
                {errors.nombreProyecto}
              </p>
            )}
          </>
        </Field>

        <Field label="Descripción del proyecto">
          <textarea
            className="input min-h-[100px]"
            value={descripcionProyecto ?? ""}
            onChange={(e) => setDescripcionProyecto(e.target.value)}
            placeholder="Describe detalladamente los objetivos, metodología y alcance del proyecto."
            required
            disabled={proyectoCerrado}
          />
        </Field>

        <Field label="Dificultades del proyecto">
          <textarea
            className="input min-h-[100px]"
            value={dificultadesProyecto ?? ""}
            onChange={(e) => setDificultadesProyecto(e.target.value)}
            placeholder="Describe dificultades, riesgos o bloqueos del proyecto."
            disabled={proyectoCerrado}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
              {errors.tipoProyectoId && (
                <p className="text-red-500 text-sm mt-1">
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
                setFuenteId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              disabled={proyectoCerrado}
            >
              <option value="">Sin fuente</option>
              {fuentes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Planificación">
            <select
              className="input"
              value={planificacionId ?? ""}
              onChange={(e) =>
                setPlanificacionId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              disabled={proyectoCerrado}
            >
              <option value="">Sin planificación</option>
              {planificacionesDelGrupo.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.descripcion} ({p.anio})
                </option>
              ))}
            </select>
          </Field>

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
                <p className="text-sm font-medium text-slate-800 mb-3">
                  Seleccionar coordinador
                </p>

                <div className="space-y-2">
                  {investigadoresSeleccionados.map((inv) => (
                    <label
                      key={inv.id}
                      className={`flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 ${
                        proyectoCerrado ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        name="coordinador"
                        checked={coordinadorId === inv.id}
                        onChange={() => {
                          if (proyectoCerrado) return;
                          setCoordinadorId(inv.id);
                          clearError("coordinadorId");
                        }}
                        disabled={proyectoCerrado}
                      />
                      <span className="text-sm text-slate-700">
                        {inv.nombre_apellido}
                      </span>
                    </label>
                  ))}
                </div>

                <p className="text-xs text-slate-500 mt-3">
                  Solo un investigador puede quedar marcado como coordinador.
                </p>
              </div>
            )}

            {errors.coordinadorId && (
              <p className="text-red-500 text-sm mt-1">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Fecha inicio">
            <>
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
            </>
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
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Guardando…"
                : isEdit
                  ? "Actualizar"
                  : "Guardar"}
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}