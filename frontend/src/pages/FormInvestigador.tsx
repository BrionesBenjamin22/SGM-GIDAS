import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import Field from "@/components/Field";
import { useUct } from "@/hooks/useUct";
import { useDedicaciones } from "@/hooks/useDedicaciones";
import { useCategoriasUtn } from "@/hooks/useCategoriasUtn";
import { useProgramasIncentivos } from "@/hooks/useProgramasIncentivos";
import {
  crearInvestigador,
  actualizarInvestigador,
} from "@/services/investigadorServices";

interface Props {
  initialData?: any;
  onCancel: () => void;
}

export default function FormInvestigador({
  initialData,
  onCancel,
}: Props) {
  const navigate = useNavigate();
  const { uct } = useUct();
  const { data: dedicaciones = [] } = useDedicaciones();
  const { data: categorias = [] } = useCategoriasUtn();
  const { data: programas = [] } = useProgramasIncentivos();

  const isEdit = Boolean(initialData);

  const [nombreApellido, setNombre] = useState("");
  const [horasSemanales, setHoras] = useState<number | "">("");
  const [dedicacionId, setDedicacionId] = useState<number | "">("");
  const [categoriaId, setCategoriaId] = useState<number | "">("");
  const [programaId, setProgramaId] = useState<number | "">("");
  const [activo, setActivo] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) return;

    setNombre(initialData.nombre_apellido);
    setHoras(initialData.horas_semanales);
    setActivo(initialData.activo ?? true);

    if (initialData.relaciones?.tipo_dedicacion)
      setDedicacionId(initialData.relaciones.tipo_dedicacion.id);

    if (initialData.relaciones?.categoria_utn)
      setCategoriaId(initialData.relaciones.categoria_utn.id);

    if (initialData.relaciones?.programa_incentivos)
      setProgramaId(initialData.relaciones.programa_incentivos.id);
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

    if (!nombreApellido.trim())
      newErrors.nombre = "Debe ingresar nombre y apellido";

    if (!horasSemanales || Number(horasSemanales) <= 0)
      newErrors.horas = "Debe ingresar horas válidas";

    if (!dedicacionId)
      newErrors.dedicacion = "Debe seleccionar dedicación";

    if (!categoriaId)
      newErrors.categoria = "Debe seleccionar categoría UTN";

    if (!programaId)
      newErrors.programa = "Debe seleccionar programa";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      nombre_apellido: nombreApellido,
      horas_semanales: Number(horasSemanales),
      tipo_dedicacion_id: Number(dedicacionId),
      categoria_utn_id: Number(categoriaId),
      programa_incentivos_id: Number(programaId),
      grupo_utn_id: uct!.id,
      activo,
    };

    if (isEdit && initialData?.id) {
      await actualizarInvestigador(
        initialData.id,
        payload,
        "investigador"
      );

      navigate(`/personal/investigador/${initialData.id}`, {
        state: { successMessage: "Actualizado con éxito!" },
      });

      return;
    }

    await crearInvestigador(payload);

    navigate("/personal", {
      state: { successMessage: "Creado con éxito!" },
    });
  };

  return (
    <form
      onSubmit={submit}
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
    >
      {/* Nombre */}
      <Field label="Nombre y apellido">
        <>
          <input
            className={`input ${errors.nombre
                ? "!border-red-500 !ring-2 !ring-red-500"
                : ""
              }`}
            value={nombreApellido}
            onChange={(e) => {
              setNombre(e.target.value);
              if (e.target.value.trim())
                clearError("nombre");
            }}
          />
          {errors.nombre && (
            <p className="text-red-500 text-sm mt-1">
              {errors.nombre}
            </p>
          )}
        </>
      </Field>

      {/* Horas */}
      <Field label="Horas semanales">
        <>
          <input
            type="number"
            className={`input ${errors.horas
                ? "!border-red-500 !ring-2 !ring-red-500"
                : ""
              }`}
            value={horasSemanales}
            onChange={(e) => {
              const value =
                e.target.value === ""
                  ? ""
                  : +e.target.value;
              setHoras(value);
              if (value) clearError("horas");
            }}
          />
          {errors.horas && (
            <p className="text-red-500 text-sm mt-1">
              {errors.horas}
            </p>
          )}
        </>
      </Field>

      {/* Dedicación */}
      <Field label="Dedicación">
        <>
          <select
            className={`input ${errors.dedicacion
                ? "!border-red-500 !ring-2 !ring-red-500"
                : ""
              } ${!dedicacionId
                ? "text-slate-400"
                : "text-slate-900"
              }`}
            value={dedicacionId}
            onChange={(e) => {
              const value = e.target.value
                ? +e.target.value
                : "";
              setDedicacionId(value);
              if (value) clearError("dedicacion");
            }}
          >
            <option value="" disabled>
              Seleccionar dedicación
            </option>
            {dedicaciones.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
          {errors.dedicacion && (
            <p className="text-red-500 text-sm mt-1">
              {errors.dedicacion}
            </p>
          )}
        </>
      </Field>

      {/* Categoría */}
      <Field label="Categoría UTN">
        <>
          <select
            className={`input ${errors.categoria
                ? "!border-red-500 !ring-2 !ring-red-500"
                : ""
              } ${!categoriaId
                ? "text-slate-400"
                : "text-slate-900"
              }`}
            value={categoriaId}
            onChange={(e) => {
              const value = e.target.value
                ? +e.target.value
                : "";
              setCategoriaId(value);
              if (value) clearError("categoria");
            }}
          >
            <option value="" disabled>
              Seleccionar categoría
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {errors.categoria && (
            <p className="text-red-500 text-sm mt-1">
              {errors.categoria}
            </p>
          )}
        </>
      </Field>

      {/* Programa */}
      <Field label="Programa de incentivos">
        <>
          <select
            className={`input ${errors.programa
                ? "!border-red-500 !ring-2 !ring-red-500"
                : ""
              } ${!programaId
                ? "text-slate-400"
                : "text-slate-900"
              }`}
            value={programaId}
            onChange={(e) => {
              const value = e.target.value
                ? +e.target.value
                : "";
              setProgramaId(value);
              if (value) clearError("programa");
            }}
          >
            <option value="" disabled>
              Seleccionar programa
            </option>
            {programas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          {errors.programa && (
            <p className="text-red-500 text-sm mt-1">
              {errors.programa}
            </p>
          )}
        </>
      </Field>

      {/* Botones */}
      <div className="flex justify-between pt-6">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
        >
          Volver
        </Button>

        <Button type="submit" size="sm">
          {isEdit ? "Actualizar" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
