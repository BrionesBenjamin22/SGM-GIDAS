import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import { useUct } from "@/hooks/useUct";
import { useTiposPersonal } from "@/hooks/useTiposPersonal";
import {
  upsertPersonal,
  actualizarPersonal,
} from "@/services/personalServices";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  tipo: "PTAA" | "PROFESIONAL";
  initialData?: any;
  onCancel: () => void;
}

export default function FormPTAAProfesional({
  tipo,
  initialData,
  onCancel,
}: Props) {
  const navigate = useNavigate();
  const { uct } = useUct();
  const { data: tiposPersonal = [] } = useTiposPersonal();
  const qc = useQueryClient();
  const isEdit = Boolean(initialData);
  const requiereSeleccionTipoPersonal = tipo === "PTAA";
  const tipoProfesional = tiposPersonal.find((t) =>
    t.nombre?.trim().toLowerCase().includes("profesional")
  );
  const tiposPersonalParaPTAA = tiposPersonal.filter(
    (t) => !t.nombre?.trim().toLowerCase().includes("profesional")
  );
  const [nombreApellido, setNombre] = useState("");
  const [horasSemanales, setHoras] = useState<number | "">("");
  const [tipoPersonalId, setTipoPersonalId] = useState<number | "">("");
  const [activo, setActivo] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) return;

    setNombre(initialData.nombre_apellido);
    setHoras(initialData.horas_semanales);
    setActivo(initialData.activo ?? true);

    if (initialData.relaciones?.tipo_personal) {
      setTipoPersonalId(initialData.relaciones.tipo_personal.id);
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!nombreApellido.trim())
      newErrors.nombre = "Debe ingresar nombre y apellido";

    if (!horasSemanales || Number(horasSemanales) <= 0)
      newErrors.horas = "Debe ingresar horas válidas";

    if (requiereSeleccionTipoPersonal && !tipoPersonalId)
      newErrors.tipoPersonal = "Debe seleccionar tipo de personal";

    if (!requiereSeleccionTipoPersonal && !tipoProfesional?.id)
      newErrors.tipoPersonal =
        "No se encontró configurado el tipo de personal Profesional";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: string) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  const payload = {
    nombre_apellido: nombreApellido,
    horas_semanales: Number(horasSemanales),
    tipo_personal_id: requiereSeleccionTipoPersonal
      ? Number(tipoPersonalId)
      : Number(tipoProfesional!.id),
    grupo_utn_id: uct!.id,
    activo,
  };

  if (isEdit && initialData?.id) {
    await actualizarPersonal(initialData.id, payload, "personal");

    await qc.invalidateQueries({
      queryKey: ["personal"],
    });

    navigate(`/personal/personal/${initialData.id}`, {
      state: { successMessage: "Actualizado con éxito!" },
    });

    return;
  }

  await upsertPersonal(payload);

  await qc.invalidateQueries({
    queryKey: ["personal"],
  });

  navigate("/personal", {
    state: { successMessage: "Creado con éxito!" },
  });
};

  return (
    <form
      onSubmit={submit}
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6"
    >
      <Field label="Nombre y apellido">
        <>
          <input
            className={`input ${
              errors.nombre ? "border-red-500 ring-2 ring-red-500" : ""
            }`}
            value={nombreApellido}
            onChange={(e) => {
              setNombre(e.target.value);
              if (e.target.value.trim()) clearError("nombre");
            }}
          />
          {errors.nombre && (
            <p className="text-red-500 text-sm mt-1">
              {errors.nombre}
            </p>
          )}
        </>
      </Field>

      <Field label="Horas semanales">
        <>
          <input
            type="number"
            className={`input ${
              errors.horas ? "border-red-500 ring-2 ring-red-500" : ""
            }`}
            value={horasSemanales}
            onChange={(e) => {
              const value = e.target.value === "" ? "" : +e.target.value;
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

      {requiereSeleccionTipoPersonal && (
        <Field label="Tipo de personal">
          <>
            <select
              className={`input ${
                errors.tipoPersonal ? "border-red-500 ring-2 ring-red-500" : ""
              }`}
              value={tipoPersonalId}
              onChange={(e) => {
                const value = e.target.value ? +e.target.value : "";
                setTipoPersonalId(value);
                if (value) clearError("tipoPersonal");
              }}
            >
              <option value="" disabled>
                Seleccionar tipo de personal
              </option>
              {tiposPersonalParaPTAA.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
            {errors.tipoPersonal && (
              <p className="text-red-500 text-sm mt-1">
                {errors.tipoPersonal}
              </p>
            )}
          </>
        </Field>
      )}

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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}