import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import Field from "@/components/Field";
import { useInvestigadores } from "@/hooks/useInvestigadores";
import { useGradosAcademicos } from "@/hooks/useGradoAcademico";
import { useRolesActividadDocencia } from "@/hooks/useActividadDocenciaRol";
import {
  crearActividadDocencia,
  getActividadDocenciaById,
  actualizarActividadDocencia,
} from "@/services/actividadDocenciaServices";

export default function FormDocenciaInvestigador() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = Boolean(id);

  const { data: investigadores = [] } = useInvestigadores();
  const { data: gradosAcademicos = [] } = useGradosAcademicos();
  const { data: rolesActividad = [] } = useRolesActividadDocencia();

  const { data: initialData, isLoading } = useQuery({
    queryKey: ["docencia", id],
    queryFn: () => (id ? getActividadDocenciaById(Number(id)) : null),
    enabled: isEdit,
  });

  const [investigadorId, setInvestigadorId] = useState<number | null>(null);
  const [curso, setCurso] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [gradoAcademicoId, setGradoAcademicoId] = useState<number | null>(null);
  const [rolActividadId, setRolActividadId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) return;

    setInvestigadorId(initialData.investigador_id);
    setCurso(initialData.curso ?? "");
    setInstitucion(initialData.institucion ?? "");
    setGradoAcademicoId(initialData.grado_academico_id ?? null);
    setRolActividadId(initialData.rol_actividad_id ?? null);

    if (initialData.fecha_inicio) {
      setFechaInicio(new Date(initialData.fecha_inicio));
    }

    if (initialData.fecha_fin) {
      setFechaFin(new Date(initialData.fecha_fin));
    }
  }, [initialData]);

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit
        ? actualizarActividadDocencia(Number(id), payload)
        : crearActividadDocencia(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["docencia"] });

      navigate("/docenciaInvestigador", {
        state: {
          successMessage: isEdit
            ? "Actualizado con éxito!"
            : "Creado con éxito!",
        },
      });
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

    if (!investigadorId)
      newErrors.investigador = "Debe seleccionar investigador";
    if (!curso.trim()) newErrors.curso = "Debe ingresar curso";
    if (!institucion.trim())
      newErrors.institucion = "Debe ingresar institución";
    if (!fechaInicio)
      newErrors.fechaInicio = "Debe seleccionar fecha de inicio";
    if (!fechaFin) newErrors.fechaFin = "Debe seleccionar fecha de fin";
    if (!gradoAcademicoId)
      newErrors.gradoAcademico = "Debe seleccionar grado académico";
    if (!rolActividadId)
      newErrors.rolActividad = "Debe seleccionar rol";

    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      newErrors.fechaFin =
        "La fecha de fin no puede ser anterior a la fecha de inicio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    mutation.mutate({
      investigador_id: investigadorId!,
      curso,
      institucion,
      fecha_inicio: fechaInicio!.toISOString().split("T")[0],
      fecha_fin: fechaFin!.toISOString().split("T")[0],
      grado_academico_id: gradoAcademicoId,
      rol_actividad_id: rolActividadId,
    });
  };

  if (isEdit && isLoading) return <p>Cargando actividad…</p>;

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        {isEdit
          ? "Editar actividad en docencia"
          : "Nueva actividad en docencia"}
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
      >
        <Field label="Investigador">
          <>
            <select
              className={`${inputClass("investigador")} ${
                !investigadorId ? "text-slate-400" : "text-slate-900"
              }`}
              value={investigadorId ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setInvestigadorId(value);
                if (value) clearError("investigador");
              }}
            >
              <option value="" disabled>
                Seleccionar investigador
              </option>
              {investigadores.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.nombre_apellido}
                </option>
              ))}
            </select>
            {errors.investigador && (
              <p className="text-red-500 text-sm mt-1">
                {errors.investigador}
              </p>
            )}
          </>
        </Field>

        <Field label="Curso">
          <>
            <input
              className={inputClass("curso")}
              value={curso}
              placeholder="Ej: Diseño de Sistemas"
              onChange={(e) => {
                setCurso(e.target.value);
                if (e.target.value.trim()) clearError("curso");
              }}
            />
            {errors.curso && (
              <p className="text-red-500 text-sm mt-1">{errors.curso}</p>
            )}
          </>
        </Field>

        <Field label="Institución">
          <>
            <input
              className={inputClass("institucion")}
              value={institucion}
              placeholder="Ej: UTN Facultad Regional La Plata"
              onChange={(e) => {
                setInstitucion(e.target.value);
                if (e.target.value.trim()) clearError("institucion");
              }}
            />
            {errors.institucion && (
              <p className="text-red-500 text-sm mt-1">
                {errors.institucion}
              </p>
            )}
          </>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Fecha inicio">
            <>
              <Calendar
                value={fechaInicio}
                onChange={(date) => {
                  setFechaInicio(date);
                  if (date) clearError("fechaInicio");
                }}
                className={inputClass("fechaInicio")}
                helperText={errors.fechaInicio ?? "DD/MM/AAAA"}
              />
              {errors.fechaInicio && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.fechaInicio}
                </p>
              )}
            </>
          </Field>

          <Field label="Fecha fin">
            <>
              <Calendar
                value={fechaFin}
                onChange={(date) => {
                  setFechaFin(date);
                  if (date) clearError("fechaFin");
                }}
                minDate={fechaInicio ?? undefined}
                className={inputClass("fechaFin")}
                helperText={errors.fechaFin ?? "DD/MM/AAAA"}
              />
              {errors.fechaFin && (
                <p className="text-red-500 text-sm mt-1">{errors.fechaFin}</p>
              )}
            </>
          </Field>
        </div>

        <Field label="Grado académico">
          <>
            <select
              className={`${inputClass("gradoAcademico")} ${
                !gradoAcademicoId ? "text-slate-400" : "text-slate-900"
              }`}
              value={gradoAcademicoId ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setGradoAcademicoId(value);
                if (value) clearError("gradoAcademico");
              }}
            >
              <option value="" disabled>
                Seleccionar grado académico
              </option>
              {gradosAcademicos.map((grado) => (
                <option key={grado.id} value={grado.id}>
                  {grado.nombre}
                </option>
              ))}
            </select>
            {errors.gradoAcademico && (
              <p className="text-red-500 text-sm mt-1">
                {errors.gradoAcademico}
              </p>
            )}
          </>
        </Field>

        <Field label="Rol en la actividad">
          <>
            <select
              className={`${inputClass("rolActividad")} ${
                !rolActividadId ? "text-slate-400" : "text-slate-900"
              }`}
              value={rolActividadId ?? ""}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setRolActividadId(value);
                if (value) clearError("rolActividad");
              }}
            >
              <option value="" disabled>
                Seleccionar rol en la actividad
              </option>
              {rolesActividad.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
            {errors.rolActividad && (
              <p className="text-red-500 text-sm mt-1">
                {errors.rolActividad}
              </p>
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
    </section>
  );
}