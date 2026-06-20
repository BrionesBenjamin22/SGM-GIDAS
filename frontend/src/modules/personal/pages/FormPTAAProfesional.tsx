import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import Calendar from "@/components/Calendar";
import { useUct } from "@/modules/grupo/hooks/useUct";
import { useTiposPersonal } from "@/modules/personal/hooks/useTiposPersonal";
import {
  upsertPersonal,
  actualizarPersonal,
} from "@/modules/personal/services/personalServices";
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
  const [fechaAltaGrupo, setFechaAltaGrupo] = useState<Date | null>(null);
  const [activo, setActivo] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) {
      setNombre("");
      setHoras("");
      setTipoPersonalId("");
      setFechaAltaGrupo(null);
      setActivo(true);
      return;
    }

    setNombre(initialData.nombre_apellido ?? "");
    setHoras(initialData.horas_semanales ?? "");
    setActivo(initialData.activo ?? true);
    setFechaAltaGrupo(
      initialData.fecha_alta_grupo
        ? new Date(`${initialData.fecha_alta_grupo}T00:00:00`)
        : null
    );
    setTipoPersonalId(
      initialData.relaciones?.tipo_personal?.id ??
        initialData.tipo_personal_id ??
        ""
    );
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!nombreApellido.trim()) {
      newErrors.nombre = "Debe ingresar nombre y apellido";
    }

    if (!horasSemanales || Number(horasSemanales) <= 0) {
      newErrors.horas = "Debe ingresar horas validas";
    }

    if (requiereSeleccionTipoPersonal && !tipoPersonalId) {
      newErrors.tipoPersonal = "Debe seleccionar tipo de personal";
    }

    if (!requiereSeleccionTipoPersonal && !tipoProfesional?.id) {
      newErrors.tipoPersonal =
        "No se encontro configurado el tipo de personal Profesional";
    }

    if (!fechaAltaGrupo) {
      newErrors.fechaAltaGrupo = "Debe ingresar la fecha de alta en el grupo";
    }

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

  const formatDateStr = (d: Date | null) => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
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
      fecha_alta_grupo: formatDateStr(fechaAltaGrupo),
      grupo_utn_id: uct!.id,
      activo,
    };

    if (isEdit && initialData?.id) {
      await actualizarPersonal(
        initialData.id,
        payload,
        tipo === "PROFESIONAL" ? "profesional" : "personal"
      );

      await qc.invalidateQueries({
        queryKey: ["personal"],
      });

      navigate(
        `/personal/${tipo === "PROFESIONAL" ? "profesional" : "personal"}/${initialData.id}`,
        {
          replace: true,
          state: { successMessage: "Actualizado con exito!" },
        }
      );

      return;
    }

    await upsertPersonal(payload);

    await qc.invalidateQueries({
      queryKey: ["personal"],
    });

    navigate("/personal", {
      state: { successMessage: "Creado con exito!" },
    });
  };

  return (
    <form
      onSubmit={submit}
      className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
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
            <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>
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
            <p className="mt-1 text-sm text-red-500">{errors.horas}</p>
          )}
        </>
      </Field>

      <Field label="Fecha de alta en el grupo">
        <Calendar
          value={fechaAltaGrupo}
          onChange={(date) => {
            setFechaAltaGrupo(date);
            if (date) clearError("fechaAltaGrupo");
          }}
          className={`input ${
            errors.fechaAltaGrupo ? "border-red-500 ring-2 ring-red-500" : ""
          }`}
          helperText={errors.fechaAltaGrupo ?? "DD/MM/AAAA"}
        />
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
              <p className="mt-1 text-sm text-red-500">{errors.tipoPersonal}</p>
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
      <label className="mb-2 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
